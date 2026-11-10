import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

test("Office modal is wired to both generation actions and closes on completion",()=>{
 const catalog=read("src/app/app/reports/office-template-catalog.tsx");
 const modal=read("src/app/app/reports/office-generation-progress.tsx");
 assert.match(catalog,/OfficeGenerationProgressModal progress=\{progress\}/);
 assert.match(catalog,/phase:"generate"/);
 assert.match(catalog,/phase:"download"/);
 assert.match(catalog,/phase:"check"/);
 assert.match(catalog,/phase:"save"/);
 assert.match(catalog,/finally\{setBusy\(false\);setProgress\(null\);\}/);
 assert.match(modal,/role="dialog"/);
 assert.match(modal,/aria-modal="true"/);
 assert.match(modal,/role="progressbar"/);
 assert.match(modal,/aria-valuenow=\{percent===null\?undefined:percent\}/);
 assert.match(modal,/progress-bar-animated/);
 assert.doesNotMatch(catalog,/setInterval\(/);
});

test("Download progress is based on received bytes rather than a simulated timer",()=>{
 const catalog=read("src/app/app/reports/office-template-catalog.tsx");
 assert.match(catalog,/response\.headers\.get\("content-length"\)/);
 const route=read("src/app/api/admin/reports/office-templates/generate/route.ts");
 assert.match(route,/"Content-Length":String\(withCharts\.byteLength\)/);
 assert.match(catalog,/response\.body\.getReader\(\)/);
 assert.match(catalog,/received\+=value\.byteLength/);
 assert.match(catalog,/Math\.round\(received\/total\*100\)/);
 assert.match(catalog,/setProgress\(null\)/);
 assert.doesNotMatch(catalog,/Math\.random\(\)/);
});

test("Progress window messages are fully localized FR/EN",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).reportsCenter as Record<string,string>;
 const en=JSON.parse(read("src/i18n/en.json")).reportsCenter as Record<string,string>;
 const keys=["Title","Checking","Generating","Downloading","Saving",
  "Indeterminate","Working","PleaseWait"].map(x=>"officeProgress"+x);
 for(const key of keys){
  assert.equal(typeof fr[key],"string",key);
  assert.equal(typeof en[key],"string",key);
  assert.ok(fr[key].trim()&&en[key].trim(),key);
 }
});
