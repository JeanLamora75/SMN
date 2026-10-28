import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
for(const [name,path] of [
 ["replanification Scrum","src/server/sprints/reschedule.ts"],
 ["correction de dates Kanban","src/server/kanban/date-correction.ts"],
 ["suppression de Sprint","src/server/sprints/deletion.ts"]
] as const){
 test(name+" : ancien parcours indisponible en schéma multiéquipes",()=>{
  const source=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  assert.match(source,/i\.schema_version<=27/);
  assert.match(source,/team_id/);
 });
}
