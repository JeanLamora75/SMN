import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {MEMBER_REMOVAL_AUDIT_SQL} from "../src/server/members/removal-audit";
import {inspectPrivacySchema} from "../scripts/smn-40-maintenance";

const names=[
 "20261109_smn39_privacy_receipt",
 "20261109_smn39_archive_restriction",
 "20261109_smn40_member_delete_guard"
] as const;
test("isolated PG18: additive privacy protections install 7/7 without changing v33",
 {skip:!process.env.SMN_TEST_DATABASE_URL,timeout:180000},async()=>{
 const raw=process.env.SMN_TEST_DATABASE_URL!;
 const url=new URL(raw);
 assert.ok(["127.0.0.1","localhost","[::1]"].includes(url.hostname));
 assert.equal(url.pathname,"/postgres");
 const id=randomUUID().replaceAll("-","").slice(0,14);
 const dbname="smn_guard_test_"+id;
 const admin=new Client({connectionString:raw,connectionTimeoutMillis:3500});
 const target=new URL(raw);target.pathname="/"+dbname;
 let db:Client|null=null,created=false;
 try{
  await admin.connect();
  const version=await admin.query<{version:string}>(`
   SELECT current_setting('server_version') AS version`);
  assert.match(version.rows[0].version,/^18\./);
  await admin.query('CREATE DATABASE "'+dbname+'"');created=true;
  const installed=await installExpress({
   adminUsername:"privacy",adminEmail:"privacy@example.test",
   password:"TemporaryIsolatedPass2026"
  },target.toString());
  assert.deepEqual(installed,{ok:true});
  db=new Client({connectionString:target.toString()});
  await db.connect();
  const baseline=await inspectPrivacySchema(db);
  assert.equal(baseline.schema_version,33);
  await db.query("BEGIN");
  try{
   await db.query("SET LOCAL lock_timeout='3s'");
   await db.query(MEMBER_REMOVAL_AUDIT_SQL);
   for(const name of names){
    const sql=readFileSync(
     new URL("../prisma/migrations/"+name+"/migration.sql",import.meta.url),"utf8");
    await db.query(sql);
   }
   const final=await inspectPrivacySchema(db);
   for(const key of ["receipt","receipt_immutable","archive_restriction",
    "archive_immutable","member_audit","member_audit_immutable","delete_guard"] as const)
    assert.equal(final[key],true,key);
   assert.equal(final.schema_version,33);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK");throw e;}
  const team=randomUUID(),batch=randomUUID(),member=randomUUID();
  await db.query(`INSERT INTO public.smn_team(id,installation_id,name,agile_mode)
    VALUES($1,'singleton','Test privacy','scrum')`,[team]);
  await db.query(`INSERT INTO public.smn_member_batch
    (id,installation_id,team_id,requested_count)
    VALUES($1,'singleton',$2,3)`,[batch,team]);
  await db.query(`INSERT INTO public.smn_member
    (id,installation_id,batch_id,member_number,display_name)
    VALUES($1,'singleton',$2,1,'Synthetic privacy')`,[member,batch]);
  await assert.rejects(
   db.query("DELETE FROM public.smn_member WHERE id=$1",[member]),
   /smn40-member-delete-requires-audited-intent/);
  const present=await db.query<{n:string}>(
   "SELECT count(*)::text AS n FROM public.smn_member WHERE id=$1",[member]);
  assert.equal(present.rows[0].n,"1");
  const receipt=randomUUID();
  await db.query(`INSERT INTO public.smn_privacy_erasure_receipt
   (id,scope_revision,operation,affected_rows) VALUES($1,$2,'erase',1)`,
   [receipt,"a".repeat(64)]);
  await assert.rejects(
   db.query("UPDATE public.smn_privacy_erasure_receipt SET affected_rows=2 WHERE id=$1",
    [receipt]),/privacy-receipt-immutable/);
  assert.equal((await inspectPrivacySchema(db)).delete_guard,true);
 }finally{
  if(db)await db.end().catch(()=>undefined);
  if(created)await admin.query('DROP DATABASE "'+dbname+'" WITH (FORCE)')
   .catch(()=>undefined);
  await admin.end().catch(()=>undefined);
 }
});
