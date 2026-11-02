import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createDefaultDashboardLayout, readDashboardLayout, saveDashboardLayout } from "../src/server/dashboard-builder/layout";

/** Isolated PostgreSQL integration tests; requires dedicated disposable v33 fixture. */
const uri=process.env.SMN_TEST_DATABASE_URL;
test("SMN-355 PG: isolated account/team rows, optimistic locking and cancel", {skip:!uri},async()=>{
 const db=new Client({connectionString:uri!});
 await db.connect();
 try{
  const installations=await db.query<{id:string}>("SELECT id FROM public.smn_installation WHERE state='initialized' AND schema_version=33 LIMIT 1");
  if(!installations.rows.length)throw new Error("Disposable initialized v33 fixture required");
  const installationId=installations.rows[0].id;
  const actors=await db.query<{id:string}>(`SELECT id FROM public.smn_account WHERE installation_id=$1 AND is_active=true AND must_change_password=false ORDER BY id LIMIT 2`,[installationId]);
  const teams=await db.query<{id:string}>(`SELECT id FROM public.smn_team WHERE installation_id=$1 AND COALESCE((to_jsonb(smn_team)->>'is_archived')::boolean,false)=false ORDER BY id LIMIT 2`,[installationId]);
  if(actors.rows.length<2||teams.rows.length<2)throw new Error("Fixture requires two active accounts and teams");
  const sql=readFileSync(new URL("../prisma/migrations/20261102_smn355_dashboard_layout/migration.sql",import.meta.url),"utf8");
  await db.query(sql);
  const first={installationId,accountId:actors.rows[0].id,teamId:teams.rows[0].id};
  const second={installationId,accountId:actors.rows[1].id,teamId:teams.rows[1].id};
  const original=await readDashboardLayout(db,first);
  const untouched=await readDashboardLayout(db,second);
  assert.equal(original.persisted, false);
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
  // Cancel: unused local draft never touches PostgreSQL.
  const cancelled=structuredClone(edited);
  cancelled.rows.push({id:randomUUID(),blocks:[]});
  assert.deepEqual((await readDashboardLayout(db,first)).layout,edited);
 } finally {
  // Fixture database is disposable; intentional persistence is inspected by the test suite.
  await db.end();
 }
});
