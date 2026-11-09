import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fingerprintManagedOfficeStores} from "../src/server/backup/erasure-office-fingerprint";

test("SMN-38: revised Office templates and reports both invalidate privacy proof",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-step2-office-"));
 const reports=join(root,"reports"),templates=join(root,"templates");
 try{
  await mkdir(reports);await mkdir(templates);
  const initial=await fingerprintManagedOfficeStores(reports,templates);
  assert.deepEqual(initial,["office=present","template=present"]);
  await writeFile(join(templates,"custom.docx"),"template version one");
  const withTemplate=await fingerprintManagedOfficeStores(reports,templates);
  assert.notDeepEqual(withTemplate,initial);
  await writeFile(join(templates,"custom.docx"),"template version two");
  const revised=await fingerprintManagedOfficeStores(reports,templates);
  assert.notDeepEqual(revised,withTemplate);
  await writeFile(join(reports,"report.docx"),"a private report");
  const withReport=await fingerprintManagedOfficeStores(reports,templates);
  assert.notDeepEqual(withReport,revised);
  await writeFile(join(reports,"unexpected.txt"),"not a managed office report");
  await assert.rejects(fingerprintManagedOfficeStores(reports,templates),
   /privacy-office-entry-untrusted/);
 }finally{await rm(root,{force:true,recursive:true});}
});
test("SMN-38: a missing store and an empty store cannot have the same revision",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-step2-office-"));
 try{
  const empty=join(root,"empty");
  await mkdir(empty);
  const result=await fingerprintManagedOfficeStores(empty,join(root,"missing"));
  assert.deepEqual(result,["office=present","template=absent"]);
 }finally{await rm(root,{force:true,recursive:true});}
});
