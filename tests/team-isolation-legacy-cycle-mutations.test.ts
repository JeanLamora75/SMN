import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
for(const [name,path] of [
 ["renommage Sprint","src/server/sprints/rename.ts"],
 ["suppression Kanban","src/server/kanban/delete.ts"]
] as const){
 test(name+" : API sans teamId refusée sur schémas v28 à v30",()=>{
  const source=read(path);
  const matches=source.match(/i\.schema_version<=27/g)??[];
  assert.ok(matches.length>=2,"les lecteurs et mutations legacy doivent rester bornés");
  assert.match(source,/i\.state='initialized'/);
 });
}
