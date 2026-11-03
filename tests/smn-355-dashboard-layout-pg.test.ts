import test from "node:test";
import assert from "node:assert/strict";
import {Client} from "pg";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {installExpress} from "../src/server/installation/install";
import {createDefaultDashboardLayout,readDashboardLayout,saveDashboardLayout} from "../src/server/dashboard-builder/layout";

/** Run the integration contract only on an explicitly isolated, initialized v33 fixture.
 * CI creates and destroys its own database; never mutate the shared smn_ci source.
 */
const initialUri=process.env.SMN_TEST_DATABASE_URL;
test("SMN-355 PG: isolated account/team rows, optimistic locking and cancel",
 {skip:!initialUri,timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const origin=new URL(initialUri!);
 if(!["127.0.0.1","localhost","[::1]"].includes(origin.hostname))
  throw Error("SMN-355 requires local disposable PostgreSQL");
 const name="smn355_"+randomUUID().replaceAll("-","");
 const adminUri=new URL(origin);adminUri.pathname="/postgres";
 const isolatedUri=new URL(origin);isolatedUri.pathname="/"+name;
 const admin=ci?new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500}):null;
 let created=false;
 if(admin){
  await admin.connect();
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  try{
   assert.deepEqual(await installExpress({
    adminUsername:"admin355",adminEmail:"admin355@example.test",password:"test-only-password355"
   },isolatedUri.toString()),{ok:true});
  }catch(error){
   await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)').catch(()=>undefined);
   await admin.end();
   throw error;
  }
 }
 const db=new Client({connectionString:ci?isolatedUri.toString():initialUri!,connectionTimeoutMillis:3500});
 try{
  await db.connect();
  if(ci){
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE role='admin'");
   await db.query(`INSERT INTO public.smn_account
    (id,installation_id,username,email,role,password_hash,must_change_password)
    VALUES('admin355second','singleton','admin355second','admin355second@example.test','admin','disabled-test-password',false)`);
   await db.query(`INSERT INTO public.smn_team(id,installation_id,name,agile_mode)
    VALUES('team355a','singleton','Équipe 355 A','scrum'),('team355b','singleton','Équipe 355 B','scrum')`);
  }
  const installations=await db.query<{id:string}>(
   "SELECT id FROM public.smn_installation WHERE state='initialized' AND schema_version=33 LIMIT 1");
  if(!installations.rows.length)throw new Error("Disposable initialized v33 fixture required");
  const installationId=installations.rows[0].id;
  const actors=await db.query<{id:string}>(`SELECT id FROM public.smn_account
    WHERE installation_id=$1 AND is_active=true AND must_change_password=false ORDER BY id LIMIT 2`,[installationId]);
  const teams=await db.query<{id:string}>(`SELECT id FROM public.smn_team
    WHERE installation_id=$1 AND COALESCE((to_jsonb(smn_team)->>'is_archived')::boolean,false)=false ORDER BY id LIMIT 2`,[installationId]);
  if(actors.rows.length<2||teams.rows.length<2)throw new Error("Fixture requires two active accounts and teams");
  const sql=readFileSync(new URL("../prisma/migrations/20261102_smn355_dashboard_layout/migration.sql",import.meta.url),"utf8");
  await db.query(sql);
  const grants=readFileSync(new URL("../prisma/migrations/20261102_smn357_dashboard_permissions/migration.sql",import.meta.url),"utf8");
  await db.query(grants);
  const first={installationId,accountId:actors.rows[0].id,teamId:teams.rows[0].id};
  const second={installationId,accountId:actors.rows[1].id,teamId:teams.rows[1].id};
  const original=await readDashboardLayout(db,first);
  const untouched=await readDashboardLayout(db,second);
  assert.equal(original.persisted,false);
  assert.equal(untouched.persisted,false);
  assert.equal(original.revision,0);
  const layout=createDefaultDashboardLayout("scrum");
  const saved=await saveDashboardLayout(db,first,layout,0);
  assert.equal(saved.revision,1);
  assert.deepEqual((await readDashboardLayout(db,first)).layout,layout);
  assert.equal((await readDashboardLayout(db,second)).persisted,false);
  await assert.rejects(saveDashboardLayout(db,first,layout,0),/revision-conflict/);
  const edited=structuredClone(layout);
  edited.rows.push({id:randomUUID(),blocks:[]});
  assert.equal((await saveDashboardLayout(db,first,edited,1)).revision,2);
  const cancelled=structuredClone(edited);
  cancelled.rows.push({id:randomUUID(),blocks:[]});
  assert.deepEqual((await readDashboardLayout(db,first)).layout,edited);
 }finally{
  await db.end().catch(()=>undefined);
  if(admin)try{
   if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');
  }finally{await admin.end().catch(()=>undefined);}
 }
});
