import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Client} from "pg";
import {inspectDisposableOfflineScope} from "../src/server/backup/restore-offline-operator-preflight";

test("SMN-34 PG18: préflight constate DB et fichiers, détecte les écrivains, ne bascule jamais",
 {timeout:120000},async()=>{
 const raw=process.env.SMN_TEST_DATABASE_URL;
 if(!raw)throw Error("SMN_TEST_DATABASE_URL required");
 const uri=new URL(raw);
 if(!["localhost","127.0.0.1","[::1]"].includes(uri.hostname)||
  uri.pathname!=="/postgres")throw Error("Disposable local PostgreSQL required");
 const id=randomUUID().replaceAll("-","").slice(0,12);
 const names={
  original:"smn_restore_test_orig_"+id,
  candidate:"smn_restore_test_cand_"+id,
  rollback:"smn_restore_test_back_"+id
 };
 const root=await mkdtemp(join(tmpdir(),"smn34-preflight-"));
 const files={
  originalRoot:join(root,"smn_restore_test_original"),
  candidateRoot:join(root,"smn_restore_test_candidate"),
  rollbackRoot:join(root,"smn_restore_test_rollback")
 };
 const admin=new Client({connectionString:raw});
 const sourceUri=new URL(raw);sourceUri.pathname="/"+names.original;
 let busy:Client|null=null;
 try{
  await admin.connect();
  for(const db of [names.original,names.candidate])
   await admin.query('CREATE DATABASE "'+db+'"');
  for(const dir of [files.originalRoot,files.candidateRoot]){
   await mkdir(join(dir,"documents"),{recursive:true});
   await writeFile(join(dir,"documents","data.txt"),dir===files.originalRoot?"old":"new");
  }
  const scope={maintenanceUri:raw,...names,files};
  const ready=await inspectDisposableOfflineScope(scope);
  assert.equal(ready.database.status,"ready");
  assert.equal(ready.files.status,"ready");
  assert.equal(ready.database.concurrentConnections,0);
  assert.equal(ready.canActivate,false);
  assert.deepEqual(ready.blockers,[]);
  assert.notEqual(ready.files.originalFingerprint,ready.files.candidateFingerprint);
  const existing=new Client({connectionString:sourceUri.toString()});
  busy=existing;await existing.connect();
  const blocked=await inspectDisposableOfflineScope(scope);
  assert.equal(blocked.database.status,"blocked");
  assert.ok((blocked.database.concurrentConnections??0)>0);
  assert.ok(blocked.blockers.includes("connections-present"));
  assert.equal(blocked.canActivate,false);
  await busy.end();busy=null;
  const after=await inspectDisposableOfflineScope(scope);
  assert.equal(after.database.status,"ready");
  assert.equal(after.canActivate,false);
  // The candidate database and directory have NOT been promoted or renamed.
  const dbs=await admin.query<{datname:string}>(
   "SELECT datname FROM pg_database WHERE datname=ANY($1::text[])",
   [[names.original,names.candidate,names.rollback]]);
  assert.deepEqual(dbs.rows.map(x=>x.datname).sort(),
   [names.original,names.candidate].sort());
 }finally{
  if(busy)await busy.end().catch(()=>undefined);
  for(const name of [names.original,names.candidate,names.rollback])
   await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)')
    .catch(()=>undefined);
  await admin.end().catch(()=>undefined);
  await rm(root,{recursive:true,force:true});
 }
});
