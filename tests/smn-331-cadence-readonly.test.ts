import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
for(const [path,method] of [
 ["src/server/sprints/cadence.ts","readCadence"],
 ["src/server/kanban/cadence.ts","readKanbanCadence"]
] as const){
 test(method+" is pure SELECT on the cadence table",()=>{
  const source=read(path);
  const start=source.indexOf("export async function "+method+"(");
  const end=source.indexOf("\nexport async function ",start+1);
  assert.ok(start>=0&&end>start);
  const body=source.slice(start,end);
  assert.doesNotMatch(body,/ensureCadenceTable\(|ensureKanbanCadenceTable\(|\bINSERT INTO\b|\bCREATE TABLE\b|\bALTER TABLE\b/i);
 });
}
