import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Sprint cockpit occupies the full private workspace width",()=>{
 const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
 const style=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-cockpit.css");
 assert.match(page,/className="smn-page container-fluid[^"]*smn-sprint-detail-cockpit"/);
 assert.match(style,/\.smn-sprint-detail-cockpit\{[^}]*width:100%;max-width:none/);
 assert.match(read("src/app/globals.css"),/\.smn-page\s*\{\s*max-width:\s*870px/);
});
