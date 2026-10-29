import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";

const source=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
test("lecteur historique monoéquipe n'est jamais utilisé sur la version 28",()=>{
 const read=source("src/server/dashboard/read.ts");
 assert.match(read,/i\.schema_version<=27/);
 assert.match(read,/resolveAdminTeam\(client,actor,requestedTeamId\)/);
 assert.match(read,/\[28,29,30,31\]\.includes\(result\.rows\[0\]\.schema_version\)/);
});
test("tableau de bord utilise acteur, teamId explicite et cycle vérifié",()=>{
 const dashboard=source("src/app/app/page.tsx");
 assert.match(dashboard,/readAccountDashboard\(db,/);
 assert.match(dashboard,/typeof query\.teamId==="string"\?query\.teamId:null/);
 assert.match(dashboard,/cycle-out-of-team/);
 assert.match(dashboard,/readSprintContext\(db,context\.teamId\)/);
});
test("lecture des Sprints conserve v27 et valide équipe/mode en v28",()=>{
 const route=source("src/app/api/sprints/context/route.ts");
 assert.match(route,/\[28,29,30,31\]\.includes\(version\.rows\[0\]\.schema_version\)/);
 assert.match(route,/resolveAdminTeam\(db,/);
 assert.match(route,/context\.mode!=="scrum"/);
 assert.match(route,/readSprintContext\(db,context\.team_id\)/);
 assert.match(route,/rows\.rows\.length!==1/);
});
test("Kanban est lecture seule, contextualisé, sans création implicite",()=>{
 const route=source("src/app/api/kanban/context/route.ts");
 const reader=source("src/server/kanban/context.ts");
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(route,/resolveAdminTeam\(db,/);
 assert.match(route,/readKanbanPeriodContext\(db,team\.team_id\)/);
 assert.match(reader,/k\.team_id=\$1/);
 assert.doesNotMatch(reader,/CREATE TABLE|ALTER TABLE|INSERT INTO/i);
});
test("Registres remplacent la sélection arbitraire d'une équipe",()=>{
 const page=source("src/app/app/admin/registries/page.tsx");
 assert.match(page,/readAccountDashboard\(db,/);
 assert.match(page,/params\.teamId/);
 assert.doesNotMatch(page,/SELECT t\.id FROM public\.smn_team/);
});
test("le sélecteur reste verrouillé malgré les nouveaux lecteurs",()=>{
 assert.match(source("src/lib/team-context-readiness.ts"),
 /SMN_MULTI_TEAM_PILOT_ACK==="I_ACCEPT_UNVERIFIED_ISOLATION"/);
 assert.match(source("src/app/app/layout.tsx"),/MULTI_TEAM_CONTEXT_READY/);
});
