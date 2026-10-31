import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("journal has its own tab; summary keeps description and context only",()=>{
 const tabs=read("src/lib/registry-detail-tabs.ts");
 const detail=read("src/app/app/admin/registries/registry-detail.tsx");
 const summary=read("src/app/app/admin/registries/registry-summary.tsx");
 assert.match(tabs,/"journal"/);
 assert.match(detail,/tab==="journal"&&<section/);
 assert.doesNotMatch(summary,/<RegistryJournal/);
});
test("description edit uses accessible icon-only action and cockpit modal",()=>{
 const summary=read("src/app/app/admin/registries/registry-summary.tsx");
 const editor=read("src/app/app/admin/registries/registry-description-editor.tsx");
 assert.match(summary,/aria-label=\{tr\("editDescription"\)\}/);
 assert.doesNotMatch(summary,/<span className="ms-1">\{tr\("edit"\)\}<\/span>/);
 assert.match(editor,/smn-registry-description-dialog smn-cockpit-modal/);
});
test("journal API is team scoped on v32 and POST receives team id",()=>{
 const api=read("src/app/api/admin/registries/[id]/journal/route.ts");
 const post=read("src/app/api/admin/registries/[id]/comments/route.ts");
 const journal=read("src/app/app/admin/registries/registry-journal.tsx");
 assert.match(api,/authorizeRegistryRecord/);
 assert.doesNotMatch(api,/withLegacyRegistryReadDb/);
 assert.match(post,/context.version!==32/);
 assert.match(journal,/createUrl=url\+"\?teamId="/);
});
test("business date uses accessible contrasting theme hero style",()=>{
 const detail=read("src/app/app/admin/registries/registry-detail.tsx");
 const css=read("src/app/app/admin/registries/registry-cockpit.css");
 assert.match(detail,/smn-registry-business-date/);
 assert.match(css,/smn-registry-business-date time/);
});
