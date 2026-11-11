import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtemp,mkdir,rm,symlink,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createRequire} from "node:module";
import {installedPrivateDocumentsDirectory,isInstalledPrivateDocumentDirectory,
 validatePrivateDocumentDirectory} from "../src/server/documents/storage-path";

const require=createRequire(import.meta.url);

test("SMN private documents default to installation data/documents, not public or app",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-private-install-"));
 try{
  const target=join(root,"data","documents");
  assert.equal(installedPrivateDocumentsDirectory(undefined,root),target);
  assert.equal(isInstalledPrivateDocumentDirectory(target,root),true);
  assert.equal(isInstalledPrivateDocumentDirectory(join(root,"public"),root),false);
  assert.equal(isInstalledPrivateDocumentDirectory(join(root,"app","data","documents"),root),false);
  await mkdir(target,{recursive:true});
  await validatePrivateDocumentDirectory(target,root);
  await assert.rejects(validatePrivateDocumentDirectory(join(root,"data"),root));
  await assert.rejects(validatePrivateDocumentDirectory(join(root,"public"),root));
 }finally{await rm(root,{recursive:true,force:true});}
});
test("installation-owned private storage rejects symlinked data parent",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-private-install-"));
 const external=await mkdtemp(join(tmpdir(),"smn-private-target-"));
 try{
  await mkdir(join(external,"documents"));
  await symlink(external,join(root,"data"),process.platform==="win32"?"junction":"dir");
  await assert.rejects(validatePrivateDocumentDirectory(
   join(root,"data","documents"),root));
 }finally{
  await rm(root,{recursive:true,force:true});
  await rm(external,{recursive:true,force:true});
 }
});
test("portable and dev startup provisions only data/documents without deleting files",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-private-install-"));
 try{
  const {ensureOfficeDirectories}=await import("../scripts/office-dirs.mjs");
  ensureOfficeDirectories(root,{});
  const documents=join(root,"data","documents");
  await writeFile(join(documents,"retained.txt"),"private");
  ensureOfficeDirectories(root,{});
  const {readFile}=await import("node:fs/promises");
  assert.equal(await readFile(join(documents,"retained.txt"),"utf8"),"private");
  await validatePrivateDocumentDirectory(documents,root);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("private documents cannot be committed and portable includes only empty directory",()=>{
 const {readFileSync}=require("node:fs") as typeof import("node:fs");
 const cwd=process.cwd();
 const ignored=readFileSync(join(cwd,".gitignore"),"utf8");
 const packaged=readFileSync(join(cwd,"scripts/windows/package-portable.mjs"),"utf8");
 assert.match(ignored,/\/data\/documents\//);
 assert.match(packaged,/path\.join\(target,"data","documents"\)/);
});
