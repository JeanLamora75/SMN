import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const page=readFileSync("src/app/app/admin/ai-briefs/prepare/page.tsx","utf8");
const entryPaths=[
 "src/app/app/admin/sprints/[sprintId]/page.tsx",
 "src/app/app/admin/sprints/[sprintId]/report/page.tsx",
 "src/app/app/admin/kanban-periods/[id]/report/page.tsx",
 "src/app/app/admin/kanban-periods/[id]/report/prepare/page.tsx"
];

test("The entry points share one preparation route",()=>{
 for(const path of entryPaths){
  const source=readFileSync(path,"utf8");
  assert.match(source,/\/app\/admin\/ai-briefs\/prepare\?/);
  assert.match(source,/Générer un brief IA/);
 }
});
test("The preparation is restricted on the server and accepts known cycle modes",()=>{
 assert.match(page,/canAccess\(account,"write"/);
 assert.match(page,/mode!=="scrum"&&mode!=="kanban"/);
 assert.match(page,/notFound\(\)/);
});
test("Preparation is read-only and exposes full collective cycle context",()=>{
 for(const name of ["Identifiant","Équipe","Produit","Mode","Dates","Statut","Préparé le"]){
  assert.ok(page.includes(name),name);
 }
 assert.match(page,/provisional=context.status!=="closed"/);
 assert.match(page,/db.query<BriefContext>\(sql,\[id\]\)/);
 assert.doesNotMatch(page,/db\.query[^\n]*\b(?:INSERT|UPDATE|DELETE)\b/i);
});
