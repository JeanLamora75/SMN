import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
for(const [p,name] of [["src/server/sprints/creation.ts","Scrum"],
 ["src/server/kanban/periods.ts","Kanban"]] as const){
 test("création historique "+name+" impossible en schéma v30",()=>{
  const service=readFileSync(new URL("../"+p,import.meta.url),"utf8");
  assert.match(service,/i\.schema_version<=27/);
 });
}
