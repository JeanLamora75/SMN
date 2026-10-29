import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("export PDF route contains exactly one handler and one generation path",()=>{
 const route=read("src/app/api/admin/reports/sprints/[id]/pdf/route.ts");
 assert.equal((route.match(/export async function POST\(/g)??[]).length,1);
 assert.equal((route.match(/generateFrozenPdf\(/g)??[]).length,1);
 assert.equal((route.match(/return new Response\(new Uint8Array\(result.bytes\)/g)??[]).length,1);
 assert.ok(route.indexOf("pg_advisory_lock")<route.indexOf("await generateFrozenPdf"));
 assert.ok(route.indexOf("storeFinalPdfArchive")<route.indexOf("return new Response"));
});
test("client sends and reuses valid operation ID",()=>{
 const ui=read("src/app/app/admin/sprints/[sprintId]/report/preview/frozen-pdf-export.tsx");
 assert.match(ui,/operation\.current=crypto\.randomUUID\(\)/);
 assert.match(ui,/X-SMN-Export-Operation/);
 assert.match(ui,/operation\.current=null/);
});
test("download uses stored bytes, not the PDF generator",()=>{
 const route=read("src/app/api/admin/reports/archives/[id]/download/route.ts");
 assert.match(route,/readVerifiedPdfArchive/);
 assert.doesNotMatch(route,/generateFrozenPdf|page\.pdf\(/);
});
