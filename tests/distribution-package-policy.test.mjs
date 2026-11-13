import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {auditWindowsDistribution} from "../scripts/windows/distribution-package-policy.mjs";
const L="@echo off\r\n\"%~dp0runtime\\node\\node.exe\" \"%~dp0runtime\\launcher.mjs\" %*\r\n";
async function fixture(){
 const root=await mkdtemp(path.join(os.tmpdir(),"smn-minimal-layout-"));
 for(const x of ["app","runtime/node","data/documents","data/tickets","updates"])
  await mkdir(path.join(root,x),{recursive:true});
 for(const [p,text] of Object.entries({
  "Demarrer SMN.bat":L,"app/server.js":"compiled",
  "app/distribution-version.json":'{"product":"SMN"}',
  "runtime/node/node.exe":"embedded","runtime/launcher.mjs":"entry"
 }))await writeFile(path.join(root,p),text);
 return root;
}
test("minimal package includes exactly four folders and one launcher",async()=>{
 const root=await fixture();
 try{
  const report=await auditWindowsDistribution(root);
  assert.equal(report.fileCount,5);
  assert.equal(report.byRoot.length,3);
  assert.equal(report.files.includes("app/server.js"),true);
 }finally{await rm(root,{recursive:true,force:true})}
});
test("top-level development artifacts are rejected",async()=>{
 const root=await fixture();
 try{
  for(const name of [".agents","_bmad","_bmad-output",".git",".github",
   "src","tests","docs","node_modules","tsconfig.json","README.md","server.js"]){
   const dest=path.join(root,name);
   await writeFile(dest,"development");
   await assert.rejects(auditWindowsDistribution(root),/distribution-root-not-minimal/);
   await rm(dest,{force:true});
  }
  await mkdir(path.join(root,"app","src"));
  await writeFile(path.join(root,"app","src","test.ts"),"private source");
  await assert.rejects(auditWindowsDistribution(root),/distribution-development-content/);
 }finally{await rm(root,{recursive:true,force:true})}
});
test("missing runtime and unauthorized launcher are rejected",async()=>{
 const root=await fixture();
 try{
  await rm(path.join(root,"runtime","node","node.exe"));
  await assert.rejects(auditWindowsDistribution(root),/distribution-runtime-incomplete/);
  await writeFile(path.join(root,"runtime","node","node.exe"),"node");
  await writeFile(path.join(root,"Demarrer SMN.bat"),"echo nothing");
  await assert.rejects(auditWindowsDistribution(root),/distribution-launcher-incomplete/);
 }finally{await rm(root,{recursive:true,force:true})}
});

test("distribution rejects bundled private document content",async()=>{
 const root=await fixture();
 try{
  const document=path.join(root,"data","documents","private.txt");
  await writeFile(document,"a confidential user document");
  await assert.rejects(auditWindowsDistribution(root),
   /distribution-private-documents-not-empty/);
 }finally{await rm(root,{recursive:true,force:true})}
});

test("SMN-456: distribution rejects bundled private Tickets CSV or Jira settings",async()=>{
 const root=await fixture();
 try{
  const ticket=path.join(root,"data","tickets","jira-config.json");
  await writeFile(ticket,'{"baseUrl":"https://jira.example.com"}');
  await assert.rejects(auditWindowsDistribution(root),
   /distribution-private-tickets-not-empty/);
 }finally{await rm(root,{recursive:true,force:true})}
});
