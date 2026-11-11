import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const server=read("src/server/sprints/ceremonies-bulk.ts");
const route=read("src/app/api/admin/sprints/[id]/ceremonies-bulk/route.ts");
const panel=read("src/app/app/admin/sprints/[sprintId]/sprint-ceremonies-panel.tsx");
const action=read("src/app/app/admin/sprints/[sprintId]/sprint-ceremonies-bulk-action.tsx");
const schema=read("prisma/baseline/v33/schema.sql");
test("le bouton dépend de la disponibilité, des droits et du nombre total toutes pages confondues",()=>{
 assert.match(panel,/canManage&&data\.source==="recorded-events"&&data\.missingSources\.length===0/);
 assert.match(panel,/total=\{data\.total\}/);
 assert.match(action,/const create=total===0/);
 assert.match(action,/const operation=create\?"create":"delete"/);
 assert.match(action,/window\.confirm/);
 assert.match(action,/chooseTypes/);
 assert.match(action,/selectedCount/);
 assert.match(action,/visibleTypes\.map/);
 assert.match(action,/router\.refresh\(\)/);
});
test("la route requiert administrateur, équipe autorisée et compteur attendu",()=>{
 assert.match(route,/authorizeApi\(req,"write"/);
 assert.match(route,/resolveAdminTeam\(db/);
 assert.match(route,/team\.team_id!==body\.teamId/);
 assert.match(route,/expectedCount/);
 assert.match(route,/expectedSelectedCount/);
 assert.match(route,/parseCeremonyDeleteTypes/);
});
test("création à partir des modèles actifs et blocage historique",()=>{
 assert.match(server,/sprint\.status==="closed"/);
 assert.match(server,/saveTemplateOccurrences\(db/);
 assert.match(server,/reconstructed:new Date\(sprint\.endAt\)/);
 assert.match(server,/error:"no-templates"/);
 assert.match(server,/schemaPrevalidated:true/);
});
test("suppression atomique des trois sources et des données dérivées en cas de succès",()=>{
 assert.match(server,/BEGIN/);
 assert.match(server,/COMMIT/);
 assert.match(server,/ROLLBACK/);
 for(const name of ["smn_sprint_ceremony","smn_scrum_template_occurrence",
  "smn_sprint_exceptional_meeting","smn_calendar_meeting_outcome_link",
  "smn_sprint_ceremony_history","smn_sprint_ceremony_status_history",
  "smn_scrum_template_occurrence_status_history",
  "smn_sprint_exceptional_meeting_status_history",
  "smn_exceptional_meeting_participant","smn_sprint_historical_event"])
  assert.match(server,new RegExp(name));
 assert.doesNotMatch(server,/TRUNCATE|CASCADE|DROP TABLE/);
 assert.match(server,/WHERE sprint_id=\$1/);
 assert.match(server,/WHERE id=ANY\(\$1::text\[\]\) AND sprint_id=\$2/);
 assert.match(server,/selectedTypes/);
});
test("les tables de dépendances du schéma v33 sont prévues",()=>{
 const children=["smn_sprint_ceremony_history","smn_sprint_ceremony_segment",
  "smn_sprint_ceremony_status_history","smn_scrum_template_occurrence_status_history",
  "smn_sprint_exceptional_meeting_history","smn_sprint_exceptional_meeting_status_history",
  "smn_exceptional_capacity_impact_history","smn_exceptional_meeting_participant",
  "smn_exceptional_meeting_participant_audit","smn_sprint_historical_event"];
 for(const name of children){
  assert.ok(schema.includes('CREATE TABLE "public"."'+name+'"'));
  assert.match(server,new RegExp(name));
 }
});
test("traductions des actions en FR et EN",()=>{
 for(const lang of ["fr","en"]){
  const messages=JSON.parse(read("src/i18n/"+lang+".json")).sprintCeremoniesBulk;
  for(const key of ["create","deleteAll","confirmSelected","working","created","deleted",
   "protected","state-changed","linked-data","no-templates","incomplete-schema","unavailable"])
   assert.equal(typeof messages[key],"string");
  for(const kind of ["planning","daily","review","retrospective","custom","exceptional"])
   assert.equal(typeof messages.type[kind],"string");
 }
});
