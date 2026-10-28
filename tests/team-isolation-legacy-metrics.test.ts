import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
for(const [name,path] of [
 ["scores de Sprint","src/server/sprints/sprint-scores.ts"],
 ["métriques Kanban","src/server/kanban/metrics-block.ts"]
] as const){
 test(name+" : mutation non contextualisée limitée aux schémas <=27",()=>{
  const src=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  assert.match(src,/i\.schema_version<=27/);
  assert.match(src,/i\.state='initialized'/);
 });
}
