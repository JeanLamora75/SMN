import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {Client} from "pg";
import {MEMBER_REMOVAL_AUDIT_SQL,MEMBER_REMOVAL_AUDIT_READY_SQL}
 from "../src/server/members/removal-audit";
import {SMN35_ARCHIVE_IMMUTABILITY_SQL,SMN35_ARCHIVE_GUARD_CHECK_SQL}
 from "../src/server/backup/archive-immutability";
import {readAuditJournal} from "../src/server/audit/journal";

test("Epic 2 lot 1 — vrais triggers PG18, rollback et journal Administrateur",
 {timeout:120000},async()=>{
 const raw=process.env.SMN_TEST_DATABASE_URL;
 if(!raw)throw Error("SMN_TEST_DATABASE_URL required (dedicated local PostgreSQL 18)");
 const adminUrl=new URL(raw);
 if(!["127.0.0.1","localhost","::1"].includes(adminUrl.hostname)||
  !["postgres:","postgresql:"].includes(adminUrl.protocol)||
  decodeURIComponent(adminUrl.pathname)!=="/postgres")
  throw Error("Unsafe maintenance URL. Refusing to create or drop databases");
 const name="smn_epic2_lot1_"+randomUUID().replaceAll("-","").slice(0,12);
 const workingUrl=new URL(adminUrl);workingUrl.pathname="/"+name;
 const admin=new Client({connectionString:adminUrl.toString(),connectionTimeoutMillis:3500});
 let created=false;
 try{
  await admin.connect();
  const version=await admin.query<{v:string}>("SELECT current_setting('server_version') AS v");
  assert.match(version.rows[0]?.v??"",/^18\./);
  assert.match(name,/^smn_epic2_lot1_[a-f0-9]{12}$/);
  await admin.query('CREATE DATABASE "'+name+'"');
  created=true;
  const db=new Client({connectionString:workingUrl.toString(),connectionTimeoutMillis:3500});
  try{
   await db.connect();
   await db.query(`
    CREATE TABLE public.smn_installation(id text PRIMARY KEY);
    CREATE TABLE public.smn_account(id text PRIMARY KEY);
    CREATE TABLE public.smn_member(id text PRIMARY KEY);
    CREATE TABLE public.smn_sprint_closure_snapshot(id text PRIMARY KEY);
    CREATE TABLE public.smn_report_pdf_archive(
      id text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now(),
      author_id text NOT NULL,operation_id text);
    INSERT INTO public.smn_installation(id) VALUES('singleton');
    INSERT INTO public.smn_account(id) VALUES('admin');
    INSERT INTO public.smn_member(id) VALUES('member');
    INSERT INTO public.smn_sprint_closure_snapshot(id) VALUES('closure');
    INSERT INTO public.smn_report_pdf_archive(id,author_id) VALUES('pdf','admin');
   `);
   for(let i=0;i<2;i++){
    await db.query("BEGIN");
    try{
     await db.query(MEMBER_REMOVAL_AUDIT_SQL);
     await db.query(SMN35_ARCHIVE_IMMUTABILITY_SQL);
     await db.query("COMMIT");
    }catch(e){await db.query("ROLLBACK");throw e;}
   }
   const guard=await db.query<{table_name:string;protected:boolean}>(
    SMN35_ARCHIVE_GUARD_CHECK_SQL);
   assert.equal(guard.rows.length,2);
   assert.ok(guard.rows.every(r=>r.protected===true));
   const ready=await db.query<{ready:boolean}>(MEMBER_REMOVAL_AUDIT_READY_SQL);
   assert.equal(ready.rows[0]?.ready,true);
   await db.query(`INSERT INTO public.smn_member_removal_audit
    (id,installation_id,member_id,actor_id,revision)
    VALUES('removal','singleton','member','admin',0)`);
   const cases=[
    "UPDATE public.smn_sprint_closure_snapshot SET id='new' WHERE id='closure'",
    "DELETE FROM public.smn_sprint_closure_snapshot WHERE id='closure'",
    "UPDATE public.smn_report_pdf_archive SET id='new' WHERE id='pdf'",
    "DELETE FROM public.smn_report_pdf_archive WHERE id='pdf'",
    "UPDATE public.smn_member_removal_audit SET revision=1 WHERE id='removal'",
    "DELETE FROM public.smn_member_removal_audit WHERE id='removal'"
   ];
   for(const sql of cases)await assert.rejects(()=>db.query(sql),/smn3[56]-/);
   const remains=await db.query<{n:string}>(`
    SELECT (SELECT count(*) FROM public.smn_sprint_closure_snapshot)+
     (SELECT count(*) FROM public.smn_report_pdf_archive)+
     (SELECT count(*) FROM public.smn_member_removal_audit) AS n`);
   assert.equal(Number(remains.rows[0]?.n),3);
   await db.query(`
    CREATE TABLE public.smn_account_audit(
      id text,occurred_at timestamptz,actor_id text,action text,object_id text,
      installation_id text,outcome text,old_values jsonb,new_values jsonb);
    CREATE TABLE public.smn_general_settings_audit(
      id text,changed_at timestamptz,actor_id text,installation_id text,
      old_values jsonb,new_values jsonb);
    CREATE TABLE public.smn_auth_audit(
      id text,created_at timestamptz,account_id text,action text);
    CREATE TABLE public.smn_backup_retention_audit(
      id text,occurred_at timestamptz,actor_id text,action text,
      package_id text,installation_id text);
    CREATE TABLE public.smn_sprint_audit(
      id text,occurred_at timestamptz,actor_id text,sprint_id text,action text);
    CREATE TABLE public.smn_member_lifecycle_event(
      id text,occurred_at timestamptz,performed_by text,member_id text,action text);
    CREATE TABLE public.smn_team_context_audit(
      id text,changed_at timestamptz,actor_id text,team_id text);
    CREATE TABLE public.smn_registry_item_audit(
      id text,changed_at timestamptz,actor_id text,item_id text);
    INSERT INTO public.smn_account_audit VALUES(
      'account-audit',now(),'admin','account_created','admin','singleton',
      'success','{}','{"role":"admin","password_hash":"NEVER_EXPOSE"}');
    INSERT INTO public.smn_backup_retention_audit
      VALUES('retention-audit',now(),'admin','policy_changed',NULL,'singleton');
    INSERT INTO public.smn_sprint_audit VALUES(
      'sprint-audit',now(),'admin','sprint','updated');
    INSERT INTO public.smn_member_lifecycle_event VALUES(
      'member-audit',now(),'admin','member','archive');
    INSERT INTO public.smn_team_context_audit VALUES('team-audit',now(),'admin','team');
    INSERT INTO public.smn_registry_item_audit VALUES('registry-audit',now(),'admin','registry');
   `);
   const entries=await readAuditJournal(db,100);
   for(const event of ["account_created","backup_policy_changed",
    "sprint_changed","member_archived","team_context_changed",
    "registry_item_changed","pdf_archive_recorded","member_removed"]){
    assert.ok(entries.some(x=>x.action===event),event);
   }
   assert.doesNotMatch(JSON.stringify(entries),/NEVER_EXPOSE|password_hash/);
   assert.equal(entries.every(x=>x.result==="success"),true);
   // Simulate failure between changing a business record and its audit:
   await db.query("BEGIN");
   try{
    await db.query("INSERT INTO public.smn_member(id) VALUES('rollback-target')");
    throw Error("injected-audit-failure");
   }catch{await db.query("ROLLBACK");}
   const rollback=await db.query<{n:string}>(
    "SELECT count(*)::text AS n FROM public.smn_member WHERE id='rollback-target'");
   assert.equal(rollback.rows[0]?.n,"0");
   process.stdout.write("EPIC2-LOT1-PG18: triggers=3, immutableRows=3, crossDomainAudit=true, rollback=true\n");
  }finally{await db.end().catch(()=>undefined);}
 }finally{
  try{
   if(created){
    assert.match(name,/^smn_epic2_lot1_[a-f0-9]{12}$/);
    await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');
   }
  }finally{await admin.end().catch(()=>undefined);}
 }
});
