import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomUUID} from "node:crypto";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectInterruptedRetention} from "../src/server/backup/retention-interruptions";

describe("Epic 2 lot 2 — rétention : interruption jamais effacée silencieusement",()=>{
 it("signale les dossiers partiellement supprimés sans détruire leur contenu",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-lot2-retention-"));
  const id=randomUUID(),pending=join(root,"packages",".retention-removing-"+id);
  try{
   await mkdir(pending,{recursive:true});
   await writeFile(join(pending,"package-evidence.enc"),"preserved");
   const result=await inspectInterruptedRetention(root);
   assert.deepEqual(result.interrupted,[id]);
   assert.deepEqual(result.unknown,[]);
   const {readFile}=await import("node:fs/promises");
   assert.equal((await readFile(join(pending,"package-evidence.enc"),"utf8")),"preserved");
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it("distingue un nom inconnu et refuse les hypothèses de réussite",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-lot2-retention-"));
  try{
   const folder=join(root,"packages");
   await mkdir(folder);
   await mkdir(join(folder,".retention-removing-unsafe"));
   const actual=await inspectInterruptedRetention(root);
   assert.equal(actual.interrupted.length,0);
   assert.deepEqual(actual.unknown,[".retention-removing-unsafe"]);
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it("un dossier de packages absent n'est pas une purge réussie ou échouée",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-lot2-retention-"));
  try{assert.deepEqual(await inspectInterruptedRetention(root),
   {interrupted:[],unknown:[]});}
  finally{await rm(root,{recursive:true,force:true});}
 });
});
