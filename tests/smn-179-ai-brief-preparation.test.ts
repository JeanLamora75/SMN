import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const page=readFileSync("src/app/app/admin/ai-briefs/prepare/page.tsx","utf8");
const entryPaths=["src/app/app/admin/sprints/[sprintId]/page.tsx","src/app/app/admin/sprints/[sprintId]/report/page.tsx","src/app/app/admin/kanban-periods/[id]/report/page.tsx","src/app/app/admin/kanban-periods/[id]/report/prepare/page.tsx"];
test("entry points preserve common brief preparation route",()=>{
 for(const path of entryPaths){const source=readFileSync(path,"utf8");assert.match(source,/\/app\/admin\/ai-briefs\/prepare\?/);}
});
test("server authorizes editing and resolves actual cycle",()=>{
 assert.match(page,/canAccess\(account,"write"/);
 assert.match(page,/mode!=="scrum"&&mode!=="kanban"/);
 assert.match(page,/notFound\(\)/);
 assert.match(page,/db.query<BriefContext>\(sql,\[id\]\)/);
});
test("preparation remains read-only and localizes collective context",()=>{
 for(const key of ["identifier","team","product","agileMode","dates","status","preparedAt"])assert.ok(page.includes('t("'+key+'")'),key);
 assert.match(page,/provisional=context.status!=="closed"/);
 assert.match(page,/localizedNativeBrief/);
 assert.doesNotMatch(page,/db\.query[^\n]*\b(?:INSERT|UPDATE|DELETE)\b/i);
});
