import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const file=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
for(const [name,path] of [
 ["objectifs de Sprint","src/server/sprints/goals.ts"],
 ["Story Points","src/server/sprints/story-points.ts"],
 ["renommage Kanban","src/server/kanban/rename.ts"]
] as const){
 test(name+" : le parcours non contextualisé est réservé aux schémas historiques",()=>{
  const source=file(path);
  assert.match(source,/i\.schema_version<=27/);
  assert.match(source,/i\.state='initialized'/);
  assert.match(source,/team_id/);
 });
}
