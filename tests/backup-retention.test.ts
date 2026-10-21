import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {mkdtemp,mkdir,lstat,readFile,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseRetentionInput,readBackupRetention,updateBackupRetention,
 expiredManagedBackups,deleteVerifiedManagedPackage} from "../src/server/backup/retention";
import type {BackupInventoryEntry} from "../src/server/backup/verification";
import {BACKUP_RETENTION_MIGRATION_SQL} from "../src/server/backup/retention-migration";

const entry=(id:string,createdAt:string,status:BackupInventoryEntry["status"]="verified")=>
 ({id,createdAt,status,integrityVerified:status==="verified"}) as BackupInventoryEntry;
describe("SMN-32 — rétention et protection des archives métier",()=>{
 it("enregistre 30 jours par défaut, bornés à 1–3650 jours",()=>{
  assert.match(BACKUP_RETENTION_MIGRATION_SQL,/DEFAULT 30/);
  assert.match(BACKUP_RETENTION_MIGRATION_SQL,/BETWEEN 1 AND 3650/);
  assert.match(BACKUP_RETENTION_MIGRATION_SQL,/policy_changed/);
  assert.match(BACKUP_RETENTION_MIGRATION_SQL,/package_deleted/);
  assert.equal(parseRetentionInput({days:30,revision:0})?.days,30);
  for(const days of [0,-1,1.5,3651,"30",null,Number.NaN]){
   assert.equal(parseRetentionInput({days,revision:0}),null);
  }
  assert.equal(parseRetentionInput({days:1,revision:-1}),null);
  assert.equal(parseRetentionInput({days:30,revision:0,other:true}),null);
 });
 it("retient les seuls paquets intègres strictement plus vieux que le seuil",()=>{
  const now=new Date("2026-10-21T10:00:00.000Z");
  const names=Array.from({length:5},()=>randomUUID());
  const items=[
   entry(names[0],"2026-09-20T09:00:00.000Z"),
   entry(names[1],"2026-09-21T10:00:00.000Z"),
   entry(names[2],"2026-09-20T09:00:00.000Z","invalid"),
   entry(names[3],"2026-09-20T09:00:00.000Z","unverifiable"),
   entry(names[4],"2030-01-01T00:00:00.000Z")
  ];
  assert.deepEqual(expiredManagedBackups(items,30,now).map(x=>x.id),[names[0]]);
 });
 it("audit en transaction et refuse une revision expirée",async()=>{
  const sql:string[]=[],row={days:30,revision:2,updated_at:new Date()};
  const db={query:async(q:string)=>{
   sql.push(q);
   if(q.includes("SELECT days,revision"))return {rowCount:1,rows:[row]};
   if(q.includes("UPDATE public.smn_backup_retention"))return {rowCount:1,rows:[{...row,days:45,revision:3}]};
   return {rowCount:1,rows:[]};
  }} as unknown as Client;
  assert.equal((await readBackupRetention(db)).days,30);
  assert.deepEqual(await updateBackupRetention(db,"admin",{days:45,revision:1}),{ok:false,error:"conflict"});
  assert.ok(sql.includes("ROLLBACK"));
  const result=await updateBackupRetention(db,"admin",{days:45,revision:2});
  assert.equal(result.ok,true);
  assert.ok(sql.some(s=>s.includes("INSERT INTO public.smn_backup_retention_audit")));
  assert.equal(sql.at(-1),"COMMIT");
 });
 it("ne supprime qu'un dossier UUID explicitement identifié sous packages",async()=>{
  const root=await mkdtemp(join(tmpdir(),"smn-retention-"));
  const id=randomUUID();
  try{
   await mkdir(join(root,"packages",id),{recursive:true});
   await mkdir(join(root,"private-documents"),{recursive:true});
   await writeFile(join(root,"packages",id,"index.json"),"private encrypted backup");
   await writeFile(join(root,"private-documents","archive.pdf"),"keep");
   await deleteVerifiedManagedPackage(root,id);
   await assert.rejects(()=>lstat(join(root,"packages",id)),/ENOENT/);
   assert.equal((await readFile(join(root,"private-documents","archive.pdf"))).toString(),"keep");
   await assert.rejects(()=>deleteVerifiedManagedPackage(root,"../private-documents"),/invalid/);
  }finally{await rm(root,{recursive:true,force:true});}
 });
});
