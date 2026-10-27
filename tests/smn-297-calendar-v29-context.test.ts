import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("les lectures du calendrier reconnaissent v29 avec résolution d'équipe",()=>{
 for(const path of [
  "src/app/api/team-calendar/route.ts",
  "src/app/api/team-calendar/periods/route.ts",
  "src/app/api/team-calendar/meetings/route.ts"
 ]){
  const content=readFileSync(path,"utf8");
  assert.match(content,/resolveAdminTeam\(db,/);
  assert.match(content,/===28\|\|\w+===29/,path);
 }
});
test("les modifications de réunion restent bloquées en schéma multiéquipes",()=>{
 for(const path of [
  "src/app/api/team-calendar/meetings/[kind]/[id]/route.ts",
  "src/app/api/team-calendar/meetings/[kind]/[id]/outcomes/route.ts"
 ])assert.match(readFileSync(path,"utf8"),/withLegacyTeamApi\(/);
});
