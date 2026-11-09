import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {SMN35_ARCHIVE_IMMUTABILITY_SQL,SMN35_ARCHIVE_GUARD_CHECK_SQL}
 from "../src/server/backup/archive-immutability";
import {MEMBER_REMOVAL_AUDIT_SQL,MEMBER_REMOVAL_AUDIT_READY_SQL}
 from "../src/server/members/removal-audit";
import {readAuditJournal} from "../src/server/audit/journal";

test("Epic 2 lot 1 — intégration avec la vraie installation native v33",
 {timeout:240000},async()=>{
 const raw=process.env.SMN_TEST_DATABASE_URL;
 if(!raw)throw Error("Only a dedicated local PostgreSQL 18 test server is supported");
 const maintenance=new URL(raw);
 if(!["127.0.0.1","localhost","::1"].includes(maintenance.hostname)||
  !["postgres:","postgresql:"].includes(maintenance.protocol)||
  decodeURIComponent(maintenance.pathname)!=="/postgres")
  throw Error("Unsafe maintenance URL; no database changed");
 const name="smn_epic2_lot1_"+randomUUID().replaceAll("-","").slice(0,12);
 assert.match(name,/^smn_epic2_lot1_[a-f0-9]{12}$/);
 const database=new URL(maintenance);database.pathname="/"+name;
 const admin=new Client({connectionString:maintenance.toString(),
  connectionTimeoutMillis:3500});
 let created=false;
 try{
  await admin.connect();
  const version=await admin.query<{v:string}>("SELECT current_setting('server_version') AS v");
  assert.match(version.rows[0]?.v??"",/^18\./);
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({
   adminUsername:"epic2audit",adminEmail:"epic2audit@example.test",
   password:"DedicatedE2Lot1Password2026"
  },database.toString()),{ok:true});
  const db=new Client({connectionString:database.toString(),connectionTimeoutMillis:3500});
  try{
   await db.connect();
   const before=await db.query<{schema_version:number}>(`
    SELECT schema_version FROM public.smn_installation WHERE id='singleton'`);
   assert.equal(before.rows.length,1);
   for(let attempt=0;attempt<2;attempt++){
    await db.query("BEGIN");
    try{
     await db.query(SMN35_ARCHIVE_IMMUTABILITY_SQL);
     await db.query(MEMBER_REMOVAL_AUDIT_SQL);
     await db.query("COMMIT");
    }catch(e){await db.query("ROLLBACK");throw e;}
   }
   const triggers=await db.query<{table_name:string;protected:boolean}>(
    SMN35_ARCHIVE_GUARD_CHECK_SQL);
   assert.equal(triggers.rows.length,2);
   assert.ok(triggers.rows.every(r=>r.protected===true));
   const removable=await db.query<{ready:boolean}>(MEMBER_REMOVAL_AUDIT_READY_SQL);
   assert.equal(removable.rows[0]?.ready,true);
   const after=await db.query<{schema_version:number}>(`
    SELECT schema_version FROM public.smn_installation WHERE id='singleton'`);
   assert.equal(after.rows[0]?.schema_version,before.rows[0]?.schema_version);
   const accounts=await db.query<{id:string}>(`
    SELECT id FROM public.smn_account WHERE username='epic2audit'`);
   assert.equal(accounts.rows.length,1);
   const removalId=randomUUID(),memberId=randomUUID();
   await db.query(`INSERT INTO public.smn_member_removal_audit
    (id,installation_id,member_id,actor_id,revision)
    VALUES($1,'singleton',$2,$3,0)`,
    [removalId,memberId,accounts.rows[0].id]);
   await assert.rejects(()=>db.query(`
    DELETE FROM public.smn_member_removal_audit WHERE id=$1`,[removalId]),
    /smn36-removal-audit-is-immutable/);
   const journal=await readAuditJournal(db,100);
   assert.ok(journal.some(x=>x.action==="member_removed"&&x.objectId===memberId));
   assert.doesNotMatch(JSON.stringify(journal),/DedicatedE2Lot1Password2026/);
   process.stdout.write("EPIC2-LOT1-NATIVE-V33-PG18: schema intact, guards=3, audit=true\n");
  }finally{await db.end().catch(()=>undefined);}
 }finally{
  try{
   if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');
  }finally{await admin.end().catch(()=>undefined);}
 }
});
