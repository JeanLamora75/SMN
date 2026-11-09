import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {rehearseOfflineFileCutover,inspectRestoreFileTree,
 validateFileCutoverDrill} from "../src/server/backup/restore-file-cutover-drill";

test("SMN-34 offline file promotion retains original and rolls back fault",async()=>{
 const parent=await mkdtemp(join(tmpdir(),"smn-cutover-files-"));
 const old=join(parent,"smn_restore_test_original");
 const fresh=join(parent,"smn_restore_test_candidate");
 const back=join(parent,"smn_restore_test_rollback");
 const make=async(root:string,text:string)=>{
  await mkdir(join(root,"documents"),{recursive:true});
  await mkdir(join(root,"office-reports"),{recursive:true});
  await writeFile(join(root,"documents","member.txt"),text);
  await writeFile(join(root,"office-reports","report.docx"),text+" office");
 };
 try{
  await make(old,"before");
  await make(fresh,"after");
  const config={originalRoot:old,candidateRoot:fresh,rollbackRoot:back};
  assert.equal(validateFileCutoverDrill(config),true);
  assert.equal(validateFileCutoverDrill({...config,originalRoot:parent}),false);
  const original=await inspectRestoreFileTree(old);
  const replacement=await inspectRestoreFileTree(fresh);
  assert.notEqual(original.sha256,replacement.sha256);
  const done=await rehearseOfflineFileCutover(config);
  assert.equal(done.status,"verified");
  assert.equal(done.rollbackRetained,true);
  assert.deepEqual(await inspectRestoreFileTree(old),replacement);
  assert.deepEqual(await inspectRestoreFileTree(back),original);
  const reverse=await rehearseOfflineFileCutover({
   originalRoot:old,candidateRoot:back,
   rollbackRoot:join(parent,"smn_restore_test_second")
  });
  assert.equal(reverse.status,"verified");
  assert.equal((await readFile(join(old,"documents","member.txt"),"utf8")),"before");
  await rm(join(parent,"smn_restore_test_second"),{recursive:true});
  await rm(back,{recursive:true,force:true});
  await make(fresh,"after-retry");
  const fault=await rehearseOfflineFileCutover({...config,injectFailureAfterPark:true});
  assert.equal(fault.status,"rolled-back");
  assert.equal((await readFile(join(old,"documents","member.txt"),"utf8")),"before");
  assert.equal((await readFile(join(fresh,"documents","member.txt"),"utf8")),"after-retry");
  await assert.rejects(rehearseOfflineFileCutover({
   ...config,originalRoot:parent
  }),/restore-file-disposable-only/);
 }finally{await rm(parent,{recursive:true,force:true});}
});
