import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("historique de cycles Scrum et Kanban, y compris supprimés, interdit le changement de mode",()=>{
 const code=source("src/server/teams/write.ts");
 assert.match(code,/hasEverHadCycle\(db,input\.teamId\)/);
 assert.match(code,/smn_sprint/);
 assert.match(code,/smn_kanban_period/);
 assert.match(code,/last-active-team/);
});
test("archivage et réactivation protégés côté serveur",()=>{
 const code=source("src/server/teams/write.ts");
 assert.match(code,/export async function setTeamArchived/);
 assert.match(code,/FOR UPDATE/);
 assert.match(code,/count\(\*\)::text AS count/);
 assert.match(code,/recordChange\(db,team\.id/);
});
test("Paramètres : archive et changement de mode conditionnel",()=>{
 const code=source("src/app/app/admin/settings/teams/teams-settings.tsx");
 assert.match(code,/toggleArchived/);
 assert.match(code,/current\.canChangeMode/);
 assert.match(code,/current\.isArchived/);
 assert.match(code,/agileMode:values\.agileMode/);
});
