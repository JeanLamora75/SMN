import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {mkdtemp,mkdir,writeFile,readFile,rename,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {beginCutover,recoverCutover,readCutover}
 from "../scripts/windows/update-transaction.mjs";

const COMPONENTS=["app","prisma","scripts","launch-portable.mjs",
 "Demarrer SMN.cmd","Recuperer admin SMN.cmd","distribution-version.json"];
const DIRS=new Set(["app","prisma","scripts"]);

async function payload(root,name,value){
 const target=path.join(root,name);
 if(DIRS.has(name)){
  await mkdir(target,{recursive:true});
  await writeFile(path.join(target,"probe.txt"),value);
 }else await writeFile(target,value);
}
async function contents(root,name){
 return readFile(path.join(root,name,...(DIRS.has(name)?["probe.txt"]:[])),"utf8");
}
for(const name of COMPONENTS){
 for(const phase of ["original-moved","replacement-moved"]){
  test("SMN-428: recovery after "+phase+" for "+name,async()=>{
   const root=await mkdtemp(path.join(os.tmpdir(),"smn-recovery-phases-"));
   const id=randomUUID();
   try{
    const prepared=path.join(root,"updates","prepared",id);
    const rollback=path.join(root,"updates","rollback",id);
    await mkdir(prepared,{recursive:true});
    await mkdir(rollback,{recursive:true});
    await mkdir(path.join(root,"data","postgres"),{recursive:true});
    await writeFile(path.join(root,"data","postgres","marker"),"USER DATA");
    for(const item of COMPONENTS){
     await payload(root,item,"OLD:"+item);
     await payload(prepared,item,"NEW:"+item);
    }
    await beginCutover(root,id,"33.0.500");
    await rename(path.join(root,name),path.join(rollback,name));
    if(phase==="replacement-moved")
     await rename(path.join(prepared,name),path.join(root,name));
    assert.equal((await readCutover(root)).state,"applying");
    assert.equal(await recoverCutover(root),"recovered");
    for(const item of COMPONENTS)
     assert.equal(await contents(root,item),"OLD:"+item);
    assert.equal(await readFile(path.join(root,"data","postgres","marker"),"utf8"),"USER DATA");
    assert.equal((await readCutover(root)).state,"recovered");
    assert.equal(await recoverCutover(root),"recovered");
   }finally{await rm(root,{recursive:true,force:true})}
  });
 }
}
test("SMN-428: no implicit write when the journal is absent",async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),"smn-recovery-none-"));
 try{
  await mkdir(path.join(root,"updates"));
  await assert.doesNotReject(recoverCutover(root));
  assert.equal(await recoverCutover(root),"none");
 }finally{await rm(root,{recursive:true,force:true})}
});
