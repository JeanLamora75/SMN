import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("activation pilote exige deux variables indépendantes",()=>{
 const gate=read("src/lib/team-context-readiness.ts");
 assert.match(gate,/SMN_MULTI_TEAM_CONTEXT_READY/);
 assert.match(gate,/SMN_MULTI_TEAM_PILOT_ACK/);
 assert.match(gate,/I_ACCEPT_UNVERIFIED_ISOLATION/);
 assert.doesNotMatch(gate,/MULTI_TEAM_CONTEXT_READY:boolean=true;/);
});
test("écritures contextualisées demandent toujours leur verrou supplémentaire",()=>{
 const paths=[
  "src/app/api/admin/team-cycles/route.ts",
  "src/app/api/admin/sprints/goals/route.ts",
  "src/app/api/admin/sprints/story-points/route.ts",
  "src/server/kanban/route-context.ts"
 ];
 for(const path of paths){
  const source=read(path);
  assert.match(source,/MULTI_TEAM_CONTEXT_READY/);
  assert.match(source,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 }
});
test("précontrôle ne modifie pas les données métier",()=>{
 const source=read("scripts/stage3-preflight.ts");
 assert.match(source,/READ ONLY/);
 assert.match(source,/ROLLBACK/);
 assert.doesNotMatch(source,/INSERT INTO|UPDATE public\.smn_|DELETE FROM/);
});
