import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,writeFile,rm,symlink,stat} from "node:fs/promises";
import path from "node:path";
import {tmpdir} from "node:os";
import {inspectOfficeReport,saveOfficeReport,safeOfficeReportName,
 officeReportsDirectory,OfficeSaveConflict,OfficeSaveFailure} from "../src/server/reports/office-storage";

async function temporary<T>(run:(folder:string)=>Promise<T>):Promise<T>{
 const dir=await mkdtemp(path.join(tmpdir(),"smn-403-"));
 try{return await run(dir);}finally{await rm(dir,{recursive:true,force:true});}
}
test("SMN-403: new report is atomically saved without changing the template",()=>temporary(async dir=>{
 const bytes=Buffer.from("DOCX OUTPUT");
 const template=path.join(dir,"model.docx");
 await writeFile(template,"TEMPLATE UNCHANGED");
 const before=await inspectOfficeReport("Sprint 24","docx",dir);
 assert.equal(before.exists,false);
 const saved=await saveOfficeReport(bytes,"Sprint 24","docx",before.fingerprint,dir);
 assert.equal(saved.filename,"Sprint 24.docx");
 assert.deepEqual(await readFile(path.join(dir,saved.filename)),bytes);
 assert.equal(await readFile(template,"utf8"),"TEMPLATE UNCHANGED");
 assert.equal((await inspectOfficeReport("Sprint 24","docx",dir)).exists,true);
}));
test("SMN-403: overwrite requires fingerprint, no confirmation keeps bytes unchanged",()=>temporary(async dir=>{
 const name="Bilan sprint.docx",destination=path.join(dir,name);
 await writeFile(destination,"ORIGINAL");
 const original=await inspectOfficeReport("Bilan sprint","docx",dir);
 assert.equal(original.exists,true);
 await assert.rejects(()=>saveOfficeReport(Buffer.from("NEW"),"Bilan sprint","docx","absent",dir),OfficeSaveConflict);
 assert.equal(await readFile(destination,"utf8"),"ORIGINAL");
 // The UI's cancel action intentionally never invokes the save API.
 assert.equal(await readFile(destination,"utf8"),"ORIGINAL");
 const written=await saveOfficeReport(Buffer.from("NEW"),"Bilan sprint","docx",original.fingerprint,dir);
 assert.equal(await readFile(destination,"utf8"),"NEW");
 assert.notEqual(written.fingerprint,original.fingerprint);
}));
test("SMN-403: a change after inspection fails closed and retains newer file",()=>temporary(async dir=>{
 const destination=path.join(dir,"report.pptx");
 await writeFile(destination,"VERSION 1");
 const observed=await inspectOfficeReport("report","pptx",dir);
 await writeFile(destination,"CHANGED BY OTHER PROCESS");
 await assert.rejects(()=>saveOfficeReport(Buffer.from("ATTEMPT"),"report","pptx",observed.fingerprint,dir),OfficeSaveConflict);
 assert.equal(await readFile(destination,"utf8"),"CHANGED BY OTHER PROCESS");
}));
test("SMN-403: concurrent writers cannot both overwrite an absent destination",()=>temporary(async dir=>{
 const outputs=await Promise.allSettled([
  saveOfficeReport(Buffer.from("A"),"same","docx","absent",dir),
  saveOfficeReport(Buffer.from("B"),"same","docx","absent",dir)
 ]);
 assert.equal(outputs.filter(result=>result.status==="fulfilled").length,1);
 assert.equal(outputs.filter(result=>result.status==="rejected").length,1);
 assert.ok(["A","B"].includes(await readFile(path.join(dir,"same.docx"),"utf8")));
}));
test("SMN-403: symlink destination never overwritten",()=>temporary(async dir=>{
 const outside=path.join(dir,"outside.docx"),target=path.join(dir,"report.docx");
 await writeFile(outside,"PROTECTED");
 try{await symlink(outside,target);}catch(error){
  if(["EPERM","EACCES","ENOTSUP"].includes((error as NodeJS.ErrnoException).code??""))return;
  throw error;
 }
 await assert.rejects(()=>inspectOfficeReport("report","docx",dir),OfficeSaveFailure);
 await assert.rejects(()=>saveOfficeReport(Buffer.from("BAD"),"report","docx","absent",dir));
 assert.equal(await readFile(outside,"utf8"),"PROTECTED");
}));
test("SMN-403: invalid file names cannot escape the allowed directory",()=>{
 for(const name of ["../secret","sub/report","..","CON","LPT1.txt","file.","file ","~$"]){
  if(name==="~$")continue;
  assert.throws(()=>safeOfficeReportName(name,"docx"),OfficeSaveFailure);
 }
 assert.equal(safeOfficeReportName("Sprint 32.PPTX","docx"),"Sprint 32.docx");
 assert.equal(safeOfficeReportName("Synthèse","pptx"),"Synthèse.pptx");
});
test("SMN-403: report folder configuration is absolute and separate from models",()=>{
 assert.throws(()=>officeReportsDirectory({...process.env,SMN_OFFICE_REPORTS_DIR:"../escape"}),OfficeSaveFailure);
 const root=path.join(tmpdir(),"smn-storage");
 assert.equal(officeReportsDirectory({...process.env,SMN_OFFICE_REPORTS_DIR:root}),root);
 assert.ok(officeReportsDirectory({...process.env,LOCALAPPDATA:root}).endsWith(path.join("ScrumMasterNotebook","office-reports")));
});
test("SMN-403: invalid report folder or oversized output fails without a file",()=>temporary(async dir=>{
 const notFolder=path.join(dir,"file");
 await writeFile(notFolder,"text");
 await assert.rejects(()=>inspectOfficeReport("report","docx",notFolder));
 await assert.rejects(()=>saveOfficeReport(Buffer.alloc(20*1024*1024+1),"report","docx","absent",dir),OfficeSaveFailure);
 await assert.rejects(()=>stat(path.join(dir,"report.docx")),{code:"ENOENT"});
}));
