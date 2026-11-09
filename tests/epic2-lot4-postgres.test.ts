import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID,randomBytes} from "node:crypto";
import {readFileSync} from "node:fs";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {initializeErasureLedger,readErasureLedger} from "../src/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";
import {withAuditedErasureTransaction,inspectErasureCommit} from "../src/server/backup/erasure-transaction";
import {currentErasureEvidence} from "../src/server/backup/erasure-protection";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {inspectMemberRelations} from "../src/server/backup/erasure-impact-graph";
import {inspectMemberForeignKeys} from "../src/server/backup/erasure-fk-discovery";

test("Epic 2 lot 4 PG18 — read-only impact scan on isolated native v33",
 {timeout:180000},async()=>{
 const url=process.env.SMN_TEST_DATABASE_URL;
 if(!url)throw Error("SMN_TEST_DATABASE_URL required");
 const maintenance=new URL(url);
 if(!["127.0.0.1","localhost","[::1]"].includes(maintenance.hostname)||
  maintenance.pathname!=="/postgres")
  throw Error("Local maintenance database /postgres required");
 const admin=new Client({connectionString:url,connectionTimeoutMillis:3500});
 const database="smn_lot4_"+randomUUID().replaceAll("-","").slice(0,16);
 const isolated=new URL(maintenance);isolated.pathname="/"+database;
 let created=false;
 try{
  await admin.connect();
  const version=await admin.query<{version:string}>("SELECT current_setting('server_version') AS version");
  assert.match(version.rows[0].version,/^18\./);
  await admin.query('CREATE DATABASE "'+database+'"');created=true;
  assert.deepEqual(await installExpress({
   adminUsername:"lot4",adminEmail:"lot4@example.test",password:"Lot4DisposablePassword2026"
  },isolated.toString()),{ok:true});
  const db=new Client({connectionString:isolated.toString(),connectionTimeoutMillis:3500});
  try{
   await db.connect();
   const team=randomUUID(),batch=randomUUID(),member=randomUUID(),assignment=randomUUID();
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES($1,'singleton','Equipe RGPD','scrum')",[team]);
   await db.query("INSERT INTO public.smn_member_batch(id,installation_id,team_id,requested_count) VALUES($1,'singleton',$2,3)",[batch,team]);
   await db.query("INSERT INTO public.smn_member(id,installation_id,batch_id,member_number,display_name) VALUES($1,'singleton',$2,1,'Membre fictif')",[member,batch]);
   await db.query("INSERT INTO public.smn_member_assignment(id,member_id,team_id,start_on,agile_role) VALUES($1,$2,$3,'2026-10-01','developer')",[assignment,member,team]);
   await db.query("INSERT INTO public.smn_member_assignment_version(id,assignment_id,revision,effective_from,allocation_percent,contract_percent,contribution_percent,scrum_master_percent,product_owner_percent,developer_percent) VALUES($1,$2,1,'2026-10-01',100,100,100,0,0,100)",[randomUUID(),assignment]);
   await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
   try{
    const rows=await inspectMemberRelations(db,member);
    assert.equal(rows.find(r=>r.table==="smn_member")?.count,1);
    assert.equal(rows.find(r=>r.table==="smn_member_assignment")?.count,1);
    assert.equal(rows.find(r=>r.table==="smn_member_assignment_version")?.count,1);
    const discovered=await inspectMemberForeignKeys(db,member);
    console.log("SMN_LOT4_FK_TABLES",JSON.stringify(discovered.map(r=>({table:r.table,state:r.state,count:r.count}))));
    assert.equal(discovered.find(r=>r.table==="smn_member_assignment")?.count,1);
    assert.equal(discovered.find(r=>r.table==="smn_member_assignment_version")?.count,1);
    await assert.rejects(
     db.query("UPDATE public.smn_member SET display_name='Forbidden' WHERE id=$1",[member]),
     /read-only transaction/i);
    await db.query("ROLLBACK");
   }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}

   // Exercise the crash-audited SQL coordination on a scratch table only.
   // This does NOT execute an actual privacy erasure on user data.
   const migration=readFileSync(join(process.cwd(),"prisma","migrations",
    "20261109_smn39_privacy_receipt","migration.sql"),"utf8");
   await db.query(migration);
   await db.query("CREATE TABLE public.smn_lot4_probe(id text PRIMARY KEY,n integer NOT NULL)");
   await db.query("INSERT INTO public.smn_lot4_probe(id,n) VALUES('probe',1)");
   const root=await mkdtemp(join(tmpdir(),"smn-lot4-pg-intent-"));
   const keys=["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
    "SMN_ERASURE_LEDGER_KEY_HEX","SMN_BACKUP_DIR"] as const;
   const before=keys.map(k=>process.env[k]);
   try{
    process.env.SMN_ERASURE_LEDGER_DIR=join(root,"ledger");
    process.env.SMN_ERASURE_ANCHOR_DIR=join(root,"anchor");
    process.env.SMN_ERASURE_LEDGER_KEY_HEX=randomBytes(32).toString("hex");
    delete process.env.SMN_BACKUP_DIR;
    await initializeErasureLedger();
    const receipt=await withAuditedErasureTransaction(db,{
     scopeRevision:"a".repeat(64),operation:"erase"
    },async()=>{
     const q=await db.query("UPDATE public.smn_lot4_probe SET n=2 WHERE id='probe'");
     return q.rowCount??0;
    });
    assert.equal(receipt.affectedRows,1);
    assert.equal(await hasUnresolvedErasureIntent(),false);
    assert.equal((await readErasureLedger()).markers.length,1);
    assert.deepEqual(await inspectErasureCommit(db,receipt.receiptId),{
     state:"committed",affectedRows:1
    });
    assert.equal((await db.query<{n:number}>(
     "SELECT n FROM public.smn_lot4_probe WHERE id='probe'")).rows[0].n,2);
    await assert.rejects(db.query(
     "DELETE FROM public.smn_privacy_erasure_receipt WHERE id=$1",
     [receipt.receiptId]),/privacy-receipt-immutable/);
    await assert.rejects(withAuditedErasureTransaction(db,{
     scopeRevision:"b".repeat(64),operation:"erase"
    },async()=>{
     await db.query("UPDATE public.smn_lot4_probe SET n=99 WHERE id='probe'");
     throw Error("fault-injected-after-write");
    }),/privacy-erasure-outcome-unresolved/);
    assert.equal((await db.query<{n:number}>(
     "SELECT n FROM public.smn_lot4_probe WHERE id='probe'")).rows[0].n,2,
     "Injected failure must not commit a partial SQL change");
    assert.equal(await hasUnresolvedErasureIntent(),true,
     "A failed/uncertain transaction must keep the durable incident intent");
    assert.equal((await currentErasureEvidence(new Date().toISOString())).state,
     "unavailable","Pending intent must block restore preflight");
   }finally{
    for(let i=0;i<keys.length;i++){
     const value=before[i];
     if(value===undefined)delete process.env[keys[i]];
     else process.env[keys[i]]=value;
    }
    await rm(root,{recursive:true,force:true});
   }
   const unchanged=await db.query<{display_name:string}>("SELECT display_name FROM public.smn_member WHERE id=$1",[member]);
   assert.equal(unchanged.rows[0].display_name,"Membre fictif");
   process.stdout.write("EPIC2-LOT4-PG18: native-v33 impact=read-only, relations=verified, source=unchanged\n");
  }finally{await db.end().catch(()=>undefined);}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+database+'" WITH (FORCE)');}
  finally{await admin.end().catch(()=>undefined);}
 }
});
