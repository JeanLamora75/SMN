import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {officeTemplatesDirectory} from "../src/server/reports/office-catalog";
import {officeReportsDirectory} from "../src/server/reports/office-storage";

const read=(name:string)=>readFileSync(name,"utf8");
test("Office folders use two distinct, accurate local paths",()=>{
 const env={LOCALAPPDATA:"C:\\Users\\Test\\AppData\\Local"} as NodeJS.ProcessEnv;
 const models=officeTemplatesDirectory(env),reports=officeReportsDirectory(env);
 assert.ok(models.endsWith(path.join("ScrumMasterNotebook","office-templates")));
 assert.ok(reports.endsWith(path.join("ScrumMasterNotebook","office-reports")));
 assert.notEqual(models,reports);
});
test("Config overrides both directories, and UI uses the same server resolvers",()=>{
 const env={SMN_OFFICE_TEMPLATES_DIR:path.resolve("/tmp/smn-templates"),
  SMN_OFFICE_REPORTS_DIR:path.resolve("/tmp/smn-reports")} as NodeJS.ProcessEnv;
 assert.equal(officeTemplatesDirectory(env),path.resolve("/tmp/smn-templates"));
 assert.equal(officeReportsDirectory(env),path.resolve("/tmp/smn-reports"));
 const page=read("src/app/app/reports/page.tsx");
 assert.match(page,/officeTemplatesDirectory\(\)/);
 assert.match(page,/officeReportsDirectory\(\)/);
 assert.match(page,/directories=\{officeFolders\}/);
});
test("Templates section contains only Office catalog, and Tags is separate",()=>{
 const page=read("src/app/app/reports/page.tsx");
 assert.match(page,/const tabs=\["reports","templates","tags","archives"\]/);
 assert.doesNotMatch(page,/TemplateLibrary/);
 assert.match(page,/tab==="templates".*<section/s);
 assert.match(page,/tab==="tags".*<section/s);
 assert.match(page,/<OfficeTags locale=\{locale==="en"\?"en":"fr"\} expanded\/>/);
 const office=read("src/app/app/reports/office-template-catalog.tsx");
 assert.doesNotMatch(office,/<OfficeTags/);
 assert.match(office,/officeTemplateDirectory/);
 assert.match(office,/officeReportsDirectory/);
});
test("All navigation and path labels exist in French and English",()=>{
 for(const language of ["fr","en"]){
  const j=JSON.parse(read("src/i18n/"+language+".json"));
  const v=j.reportsCenter;
  for(const key of ["tags","officeTemplateDirectory","officeReportsDirectory",
   "officeDirectoryUnavailable","officeTemplateDirectoryHint","officeReportsDirectoryHint"]){
   assert.equal(typeof v[key],"string",language+":"+key);
   assert.ok(v[key].trim(),language+":"+key);
  }
 }
});
