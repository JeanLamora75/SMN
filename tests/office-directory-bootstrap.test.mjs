import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,rmSync,writeFileSync,existsSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {ensureOfficeDirectories} from "../scripts/office-dirs.mjs";

test("Office folders are created by default and existing documents are retained",()=>{
 const root=mkdtempSync(path.join(tmpdir(),"smn-office-default-"));
 try{
  const env={SMN_OFFICE_TEMPLATES_DIR:"",SMN_OFFICE_REPORTS_DIR:""};
  ensureOfficeDirectories(root,env);
  const templates=path.join(root,"data","office","templates");
  const reports=path.join(root,"data","office","reports");
  assert.ok(existsSync(templates));
  assert.ok(existsSync(reports));
  writeFileSync(path.join(templates,"existing.docx"),"untouched");
  ensureOfficeDirectories(root,env);
  assert.equal(readFileSync(path.join(templates,"existing.docx"),"utf8"),"untouched");
 }finally{rmSync(root,{recursive:true,force:true});}
});

test("Office folders honor absolute overrides and refuse relative paths",()=>{
 const root=mkdtempSync(path.join(tmpdir(),"smn-office-custom-"));
 try{
  const external=path.join(root,"custom");
  ensureOfficeDirectories(root,{
   SMN_OFFICE_TEMPLATES_DIR:path.join(external,"models"),
   SMN_OFFICE_REPORTS_DIR:path.join(external,"reports")
  });
  assert.ok(existsSync(path.join(external,"models")));
  assert.ok(existsSync(path.join(external,"reports")));
  assert.throws(()=>ensureOfficeDirectories(root,{
   SMN_OFFICE_TEMPLATES_DIR:"../invalid",SMN_OFFICE_REPORTS_DIR:""
  }),/must be absolute/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
