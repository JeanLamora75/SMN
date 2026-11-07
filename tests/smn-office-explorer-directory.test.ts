import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(name:string)=>readFileSync(name,"utf8");

test("Office folder buttons use the two fixed kinds and do not send an arbitrary path",()=>{
 const ui=read("src/app/app/reports/office-template-catalog.tsx");
 assert.match(ui,/openDirectory\("templates"\)/);
 assert.match(ui,/openDirectory\("reports"\)/);
 assert.match(ui,/body:JSON\.stringify\(\{kind\}\)/);
 assert.doesNotMatch(ui,/body:JSON\.stringify\(\{(?:path|directory)\}\)/);
 assert.match(ui,/officeOpenDirectory/);
 assert.match(ui,/officeExplorerError/);
 assert.match(ui,/aria-label=/);
});
test("Explorer endpoint is authenticated and guarded by local origin validation",()=>{
 const route=read("src/app/api/admin/reports/office-templates/open-directory/route.ts");
 const service=read("src/server/reports/open-office-directory.ts");
 const auth=read("src/server/auth/authorization.ts");
 assert.match(route,/authorizeApi\(request,"read",scope\)/);
 assert.match(route,/readJsonObject\(request,256\)/);
 assert.match(route,/isOfficeDirectoryKind\(input\.kind\)/);
 assert.match(route,/process\.platform!=="win32"/);
 assert.match(auth,/validMutationOrigin/);
 assert.match(service,/value==="templates"\|\|value==="reports"/);
 assert.match(service,/spawn\("explorer\.exe",\[directory\],\{shell:false/);
 assert.match(service,/entry\.isSymbolicLink\(\)/);
 assert.match(service,/realpath\(directory\)/);
});
test("Office folder actions and failures are localized in French and English",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).reportsCenter;
 const en=JSON.parse(read("src/i18n/en.json")).reportsCenter;
 for(const key of ["officeOpenDirectory","officeExplorerError","officeExplorerUnsupported"]){
  assert.ok(fr[key]&&en[key],key);
  assert.notEqual(fr[key],en[key]);
 }
});
