import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Cockpit uses real API envelope and selected team identifier",()=>{
 const api=source("src/app/api/admin/links/route.ts");
 const categories=source("src/app/api/admin/links/categories/route.ts");
 const cockpit=source("src/app/app/admin/links/links-cockpit.tsx");
 assert.match(api,/jsonResult\(\{items:await withAuthDb/);
 assert.match(categories,/jsonResult\(\{items:await withAuthDb/);
 assert.match(cockpit,/new URLSearchParams\(\{teamId\}\)/);
 assert.match(cockpit,/if\(!links\.ok\|\|!cats\.ok\)/);
});
test("team change resets cockpit state and never reuses previous team results",()=>{
 const page=source("src/app/app/admin/links/page.tsx");
 assert.match(page,/<LinksCockpit key=\{context\.team_id\} teamId=\{context\.team_id\}/);
});
test("external links open securely in a separate tab",()=>{
 const cockpit=source("src/app/app/admin/links/links-cockpit.tsx");
 assert.match(cockpit,/target="_blank" rel="noopener noreferrer"/);
});
