import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const api=read("src/app/api/admin/registries/[id]/route.ts");
const implementation=read("src/server/registries/delete-item.ts");
const action=read("src/app/app/admin/registries/registry-delete-action.tsx");
const row=read("src/app/app/admin/registries/registry-list-row.tsx");
const cards=read("src/app/app/admin/registries/registry-card.tsx");
const list=read("src/app/app/admin/registries/registry-list.tsx");
const detail=read("src/app/app/admin/registries/registry-detail.tsx");

test("DELETE exige authentification, équipe, révision et garde le verrou de concurrence",()=>{
 assert.match(api,/export async function DELETE/);
 assert.match(api,/authorizeApi\(req,"write"/);
 assert.match(api,/resolveRegistryReadContext\(db/);
 assert.match(api,/deleteRegistryItem\(db,id/);
 assert.match(implementation,/FOR UPDATE OF r/);
 assert.match(implementation,/r\.rows\[0\]\.revision!==revision/);
 assert.match(implementation,/BEGIN/);
 assert.match(implementation,/ROLLBACK/);
 assert.match(implementation,/COMMIT/);
});
test("les associations entrantes, les commentaires et les audits sont traités sans CASCADE global",()=>{
 assert.match(implementation,/smn_registry_comment_revision/);
 assert.match(implementation,/target_kind='record' AND target_id=\$1/);
 assert.match(implementation,/smn_action_link_audit/);
 assert.match(implementation,/smn_registry_linked_request/);
 assert.match(implementation,/smn_calendar_meeting_outcome_link/);
 assert.match(implementation,/smn_kanban_registry_link/);
 assert.match(implementation,/smn_registry_cycle_link_audit/);
 assert.match(implementation,/smn_risk_assessment_audit/);
 assert.match(implementation,/error:"linked-data"/);
 assert.doesNotMatch(implementation,/TRUNCATE|CASCADE|DROP TABLE/);
});
test("listes, cartes et fiche proposent une suppression confirmée sans action pour les lecteurs",()=>{
 assert.match(row,/canManage&&<RegistryDeleteAction/);
 assert.match(cards,/canManage&&<RegistryDeleteAction/);
 assert.match(detail,/canManage&&<RegistryDeleteAction/);
 assert.match(action,/window\.confirm/);
 assert.match(action,/method:"DELETE"/);
 assert.match(action,/role="alert"/);
 assert.match(list,/onDeleted=\{deleted\}/);
});
test("messages de suppression traduits en français et en anglais",()=>{
 for(const language of ["fr","en"]){
  const locale=JSON.parse(read("src/i18n/"+language+".json"));
  for(const key of ["button","deleting","confirm","notFound","conflict","linkedData","unavailable","schemaMismatch","protectedOperation","operationTimeout"])
   assert.equal(typeof locale.registryDelete[key],"string");
 }
});

test("la suppression expose des catégories sûres sans informations SQL sensibles",()=>{
 assert.match(api,/code==="42P01"\|\|code==="42703"/);
 assert.match(api,/code==="55000"/);
 assert.match(api,/code==="57014"/);
 assert.match(action,/data\.error==="schema-mismatch"/);
 assert.match(action,/data\.error==="protected-operation"/);
 assert.match(action,/data\.error==="operation-timeout"/);
 assert.match(implementation,/smn-registry-delete-failed/);
 assert.doesNotMatch(api,/error\.detail|error\.constraint|error\.table/);
});
