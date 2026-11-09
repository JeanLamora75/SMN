import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,rm,symlink,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {randomUUID} from "node:crypto";
import {inspectUnfinishedBackupArtifacts} from "../src/server/backup/operation-artifacts";
test("orphan partial backup, torn purge and suspicious files remain unresolved",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn41-artifacts-"));
 const backup=randomUUID(),purge=randomUUID();
 try{
  const packages=join(root,"packages");await mkdir(packages);
  await mkdir(join(packages,"."+backup+".partial"));
  await mkdir(join(packages,".retention-removing-"+purge));
  await mkdir(join(packages,".retention-removing-unsafe"));
  await writeFile(join(packages,".broken.partial"),"partial");
  const data=await inspectUnfinishedBackupArtifacts(root);
  assert.deepEqual(data.stagingBackupIds,[backup]);
  assert.deepEqual(data.retentionPendingIds,[purge]);
  assert.equal(data.unknownBackupArtifacts,1);
  assert.equal(data.unknownRetentionArtifacts,1);
  assert.equal(JSON.stringify(data).includes("unsafe"),false);
  assert.equal(JSON.stringify(data).includes("broken"),false);
  if(process.platform!=="win32"){
   await symlink(packages,join(root,"symlink-to-package"));
   await symlink(packages,join(packages,".another.partial"));
   assert.equal((await inspectUnfinishedBackupArtifacts(root)).unknownBackupArtifacts,2);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
test("missing folder is not evidence of a completed backup",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn41-artifacts-"));
 try{
  const data=await inspectUnfinishedBackupArtifacts(root);
  assert.equal(data.stagingBackupIds.length,0);
  assert.equal(data.retentionPendingIds.length,0);
 }finally{await rm(root,{recursive:true,force:true});}
});
