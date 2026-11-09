import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,mkdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {initializeErasureLedger,readErasureLedger} from "../src/server/backup/erasure-ledger";
import {eraseDependentMember} from "../src/server/backup/erasure-dependent-member";
import {verifyErasureIntegrity} from "../src/server/backup/erasure-completeness";
import {currentErasureEvidence,evaluateErasureProtection} from "../src/server/backup/erasure-protection";

test("SMN-40 PG18 — old clone refused, post-erasure clone verified, external ledger retained",
 {timeout:180000},async()=>{
 const raw=process.env.SMN_TEST_DATABASE_URL;
 if(!raw)throw Error("SMN_TEST_DATABASE_URL required");
 const maintenance=new URL(raw);
 if(!["localhost","127.0.0.1","[::1]"].includes(maintenance.hostname)||
  maintenance.pathname!=="/postgres")throw Error("Only disposable local PostgreSQL");
 const admin=new Client({connectionString:raw,connectionTimeoutMillis:3500});
 const id=randomUUID().replaceAll("-","").slice(0,15);
 const source="smn_erase_source_"+id;
 const beforeDb="smn_erase_before_"+id;
 const afterDb="smn_erase_after_"+id;
 const uri=(db:string)=>{const url=new URL(maintenance);url.pathname="/"+db;return url.toString();};
 const temporary=await mkdtemp(join(tmpdir(),"smn40-restore-"));
 const vars=["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX","SMN_BACKUP_DIR",
  "SMN_PRIVATE_DOCUMENTS_DIR","SMN_PRIVATE_REPORT_ARCHIVE_DIR",
  "SMN_OFFICE_REPORTS_DIR","SMN_OFFICE_TEMPLATES_DIR"] as const;
 const original=vars.map(k=>process.env[k]);
 const created:string[]=[];
 let db:Client|null=null;
 try{
  process.env.SMN_ERASURE_LEDGER_DIR=join(temporary,"ledger");
  process.env.SMN_ERASURE_ANCHOR_DIR=join(temporary,"anchor");
  process.env.SMN_ERASURE_LEDGER_KEY_HEX=randomBytes(32).toString("hex");
  process.env.SMN_PRIVATE_DOCUMENTS_DIR=join(temporary,"documents");
  process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=join(temporary,"pdf");
  process.env.SMN_OFFICE_REPORTS_DIR=join(temporary,"reports");
  process.env.SMN_OFFICE_TEMPLATES_DIR=join(temporary,"templates");
  delete process.env.SMN_BACKUP_DIR;
  await mkdir(process.env.SMN_PRIVATE_DOCUMENTS_DIR,{recursive:true});
  await admin.connect();
  const version=await admin.query<{v:string}>(
   "SELECT current_setting('server_version') AS v");
  assert.match(version.rows[0].v,/^18\./);
  await admin.query('CREATE DATABASE "'+source+'"');created.push(source);
  assert.deepEqual(await installExpress({
   adminUsername:"review",adminEmail:"review@example.test",
   password:"TemporaryIsolatedPass2026"
  },uri(source)),{ok:true});
  db=new Client({connectionString:uri(source)});
  await db.connect();
  const team=randomUUID(),batch=randomUUID(),subject=randomUUID(),assignment=randomUUID();
  await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) "+
   "VALUES($1,'singleton','Equipe temporaire','scrum')",[team]);
  await db.query("INSERT INTO public.smn_member_batch "+
   "(id,installation_id,team_id,requested_count) "+
   "VALUES($1,'singleton',$2,3)",[batch,team]);
  await db.query("INSERT INTO public.smn_member "+
   "(id,installation_id,batch_id,member_number,display_name) "+
   "VALUES($1,'singleton',$2,1,'Provisional subject')",[subject,batch]);
  await db.query("INSERT INTO public.smn_member_assignment "+
   "(id,member_id,team_id,start_on,agile_role) "+
   "VALUES($1,$2,$3,'2026-10-01','developer')",[assignment,subject,team]);
  await db.query("INSERT INTO public.smn_member_assignment_version "+
   "(id,assignment_id,revision,effective_from,allocation_percent,"+
   "contract_percent,contribution_percent,scrum_master_percent,"+
   "product_owner_percent,developer_percent) "+
   "VALUES($1,$2,1,'2026-10-01',100,100,100,0,0,100)",[randomUUID(),assignment]);
  await db.end();db=null;
  // Database-level clone is a disposable PostgreSQL 18 snapshot. It is NOT a
  // substitute for the separate v4 encrypted backup/restore qualification.
  await admin.query('CREATE DATABASE "'+beforeDb+'" TEMPLATE "'+source+'"');
  created.push(beforeDb);
  await initializeErasureLedger();
  const beforeCapture=new Date().toISOString();
  db=new Client({connectionString:uri(source)});await db.connect();
  const deleted=await eraseDependentMember(db,{
   memberId:subject,scopeRevision:"e".repeat(64)
  });
  assert.equal(deleted.affectedRows,3);
  const journal=await readErasureLedger();
  assert.equal(journal.markers.length,1);
  assert.equal(journal.markers[0].version,2);
  assert.match(journal.markers[0].subjectToken??"",/^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(journal.markers).includes(subject),false);
  const obsolete=await currentErasureEvidence(beforeCapture,db);
  assert.equal(evaluateErasureProtection(beforeCapture,obsolete).code,
   "previously-erased-data");
  assert.deepEqual((await verifyErasureIntegrity(db)).complete,true);
  await db.end();db=null;
  await admin.query('CREATE DATABASE "'+afterDb+'" TEMPLATE "'+source+'"');
  created.push(afterDb);
  const restored=new Client({connectionString:uri(afterDb)});
  try{
   await restored.connect();
   await restored.query("BEGIN TRANSACTION READ ONLY");
   const proof=await verifyErasureIntegrity(restored);
   assert.equal(proof.complete,true,proof.reason);
   assert.equal((await restored.query(
    "SELECT id FROM public.smn_member WHERE id=$1",[subject])).rows.length,0);
   assert.equal((await restored.query(
    "SELECT id FROM public.smn_member_assignment WHERE id=$1",[assignment])).rows.length,0);
   assert.equal((await restored.query(
    "SELECT id FROM public.smn_member_assignment_version WHERE assignment_id=$1",
    [assignment])).rows.length,0);
   await new Promise(resolve=>setTimeout(resolve,20));
   const postCapture=new Date().toISOString();
   const evidence=await currentErasureEvidence(postCapture,restored);
   assert.equal(evidence.state,"verified");
   if(evidence.state==="verified"){
    assert.equal(evidence.memberScopeVerified,true);
    assert.equal(evidence.completeHistory,false,
     "No global restoration until all personal-data deletions are journaled");
   }
   assert.equal(evaluateErasureProtection(postCapture,evidence).permitted,false);
   await restored.query("COMMIT");
  }finally{await restored.end();}
  const obsoleteDb=new Client({connectionString:uri(beforeDb)});
  try{
   await obsoleteDb.connect();
   assert.equal((await obsoleteDb.query(
    "SELECT id FROM public.smn_member WHERE id=$1",[subject])).rows.length,1);
   assert.equal((await verifyErasureIntegrity(obsoleteDb)).complete,false);
   const evidence=await currentErasureEvidence(beforeCapture,obsoleteDb);
   assert.equal(evaluateErasureProtection(beforeCapture,evidence).permitted,false);
  }finally{await obsoleteDb.end();}
  process.stdout.write(
   "EPIC2-SMN40-PG18: old snapshot denied, post-erase clone integrity verified\n");
 }finally{
  if(db)await db.end().catch(()=>undefined);
  for(const name of created.reverse())
   await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)').catch(()=>undefined);
  await admin.end().catch(()=>undefined);
  for(let i=0;i<vars.length;i++){
   if(original[i]===undefined)delete process.env[vars[i]];
   else process.env[vars[i]]=original[i];
  }
  await rm(temporary,{recursive:true,force:true});
 }
});
