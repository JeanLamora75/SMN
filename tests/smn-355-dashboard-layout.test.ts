import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultDashboardLayout, validateDashboardLayout } from "../src/server/dashboard-builder/layout";
import { readFileSync } from "node:fs";

for(const mode of ["scrum","kanban"] as const){
 test(`SMN-355 AC2: default ${mode} has two header blocks and stable unique ids`,()=>{
  const layout=createDefaultDashboardLayout(mode);
  assert.equal(layout.schemaVersion,1);
  assert.equal(layout.header.blocks.length,2);
  assert.ok(layout.rows.length>0);
  assert.doesNotThrow(()=>validateDashboardLayout(layout));
  const ids=[...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)].flatMap(b=>[b.id,...b.slots.map(s=>s.id)]);
  ids.push(...layout.rows.map(r=>r.id));
  assert.equal(new Set(ids).size,ids.length);
 });
}
test("SMN-355 AC1: duplicate ids and unknown slots are rejected",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 layout.header.blocks[1].id=layout.header.blocks[0].id;
 assert.throws(()=>validateDashboardLayout(layout),/invalid-id/);
 const other=createDefaultDashboardLayout("kanban");
 other.rows[0].blocks[0].slots[0].templateSlotId="invalid";
 assert.throws(()=>validateDashboardLayout(other),/invalid-slot/);
});
test("SMN-355 AC4: additive PostgreSQL layout migration with tenant and revision protections",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261102_smn355_dashboard_layout/migration.sql",import.meta.url),"utf8");
 assert.match(sql,/jsonb NOT NULL/i);
 assert.match(sql,/PRIMARY KEY \(installation_id,account_id,team_id\)/);
 assert.match(sql,/FOREIGN KEY \(installation_id,team_id\)/);
 assert.match(sql,/revision bigint NOT NULL/);
});
test("SMN-355 AC3: no storage on read; write requires expected revision",()=>{
 const code=readFileSync(new URL("../src/server/dashboard-builder/layout.ts",import.meta.url),"utf8");
 const read=code.split("export async function readDashboardLayout")[1].split("export async function saveDashboardLayout")[0];
 assert.doesNotMatch(read,/\b(INSERT|UPDATE|DELETE)\b/i);
 assert.match(code,/ON CONFLICT DO NOTHING/);
 assert.match(code,/AND revision=\$6/);
 assert.match(code,/ROLLBACK/);
});

test("Dashboard Builder: custom titles on M01-M06 blocks and slots are persisted and validated",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 const block=layout.rows[0].blocks[0];
 block.title="Qualité du sprint";
 block.slots[0].title="Tickets terminés";
 assert.doesNotThrow(()=>validateDashboardLayout(layout));
 const saved=JSON.parse(JSON.stringify(layout));
 assert.equal(saved.rows[0].blocks[0].title,"Qualité du sprint");
 assert.equal(saved.rows[0].blocks[0].slots[0].title,"Tickets terminés");
 block.title="x".repeat(101);
 assert.throws(()=>validateDashboardLayout(layout),/block-title-invalid/);
 block.title="Qualité";
 block.slots[0].title="x".repeat(101);
 assert.throws(()=>validateDashboardLayout(layout),/slot-title-invalid/);
});
test("Dashboard Builder: personalized titles render in edit and consultation modes",()=>{
 const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 assert.match(editor,/setBlockTitle\(/);
 assert.match(editor,/setSlotTitle\(/);
 assert.match(editor,/Titre du bloc/);
 assert.match(editor,/Titre de l'emplacement/);
 assert.match(consultation,/block\.title\?\.trim\(\)/);
 assert.match(consultation,/slot\.title\?\.trim\(\)/);
});
