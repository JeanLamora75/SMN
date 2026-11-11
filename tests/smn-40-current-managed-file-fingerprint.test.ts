import assert from "node:assert/strict";
import {test} from "node:test";
import {createHash} from "node:crypto";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fingerprintCurrentFileInventories}
 from "../src/server/backup/current-managed-file-fingerprint";
import {inspectRestoreFileTree} from "../src/server/backup/restore-file-cutover-drill";

test("source inventory fingerprint equals independently scanned reconstructed files",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-current-inventory-"));
 const bytes=Buffer.from("sample non personal file contents");
 const hash=createHash("sha256").update(bytes).digest("hex");
 try{
  await mkdir(join(root,"documents"),{recursive:true});
  await mkdir(join(root,"office-reports"));
  await writeFile(join(root,"documents","abc.txt"),bytes);
  await writeFile(join(root,"office-reports","report.docx"),bytes);
  const source=fingerprintCurrentFileInventories(
   [{name:"abc.txt",hash,length:bytes.length}],
   {pdf:[],office:[{name:"report.docx",hash,size:bytes.length}],templates:[]}
  );
  const candidate=await inspectRestoreFileTree(root);
  assert.deepEqual(source,candidate);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("source inventory denies duplicate names and malformed component sizes",()=>{
 const hash="a".repeat(64),entry={name:"a.txt",hash,length:5};
 assert.throws(()=>fingerprintCurrentFileInventories([entry,entry],
  {pdf:[],office:[],templates:[]}),/migration-managed-file-invalid/);
 assert.throws(()=>fingerprintCurrentFileInventories([{...entry,length:-1}],
  {pdf:[],office:[],templates:[]}),/migration-managed-file-invalid/);
});
