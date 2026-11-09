import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import type {Client} from "pg";
import {managedBinaryScopeEmpty} from "../src/server/backup/erasure-restricted-member";

test("SMN-38/39: empty folders do not hide dangling PDF archive records",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-step2-dangling-"));
 const keys=["SMN_PRIVATE_DOCUMENTS_DIR","SMN_PRIVATE_REPORT_ARCHIVE_DIR",
  "SMN_OFFICE_REPORTS_DIR","SMN_OFFICE_TEMPLATES_DIR"] as const;
 const previous=keys.map(k=>process.env[k]);
 const dirs=keys.map((_,i)=>join(root,"store-"+i));
 try{
  for(let i=0;i<keys.length;i++){
   await mkdir(dirs[i]);
   process.env[keys[i]]=dirs[i];
  }
  const empty={query:async()=>({rows:[]})} as unknown as Client;
  assert.equal(await managedBinaryScopeEmpty(empty),true);
  const dangling={query:async()=>({rows:[{
   id:"00000000-0000-4000-8000-000000000001",
   stored_name:"00000000-0000-4000-8000-000000000001.pdf",
   sha256:"a".repeat(64),byte_length:12
  }]})} as unknown as Client;
  assert.equal(await managedBinaryScopeEmpty(dangling),false);
  await writeFile(join(dirs[2],"report.docx"),"private report");
  assert.equal(await managedBinaryScopeEmpty(empty),false);
 }finally{
  keys.forEach((k,i)=>{
   if(previous[i]===undefined)delete process.env[k];
   else process.env[k]=previous[i];
  });
  await rm(root,{recursive:true,force:true});
 }
});
