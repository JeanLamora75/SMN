import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
for(const path of [
 "src/app/api/admin/kanban-periods/list/route.ts",
 "src/app/api/admin/kanban-periods/preview/route.ts"
]){
 test(path+" ne répare jamais le schéma pendant GET",()=>{
  const source=read(path);
  assert.doesNotMatch(source,/ensureKanbanPeriodTables\(db\)/);
  assert.doesNotMatch(source,/reconcileKanbanStates\(db\)/);
  assert.match(source,/to_regclass/);
 });
}
