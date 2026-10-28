import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("sprint detail context resolves using team's agile mode",()=>{
 for(const name of ["context","goals-detail-read","indicators-read","ceremonies-detail-read","presence-detail-read"]){
  const text=read("src/server/sprints/"+name+".ts");
  assert.match(text,/to_jsonb\(t\)->>'agile_mode'/);
 }
});
test("detail page keeps team identity through tabs and return link",()=>{
 const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
 const tabs=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-tabs.tsx");
 assert.match(page,/teamId=\{teamId\}/);
 assert.match(tabs,/new URLSearchParams\(\{tab:key,teamId\}\)/);
 assert.match(page,/smn-sprint-detail-hero/);
 assert.match(page,/sprint-detail-cockpit\.css/);
});
