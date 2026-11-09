import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {Client} from "pg";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {verifyRemovedRetentionPackage} from "../src/server/backup/retention-evidence";
import {inspectUnfinishedBackupArtifacts} from "../src/server/backup/operation-artifacts";

test("PG18 — interrupted retention is never a verified deletion without audit and absence",
 {timeout:90000},async()=>{
 const raw=process.env.SMN_TEST_DATABASE_URL;
 if(!raw)throw Error("local-test-database-required");
 const uri=new URL(raw);
 if(!["127.0.0.1","localhost","[::1]"].includes(uri.hostname)||
  uri.pathname!=="/postgres")throw Error("local-disposable-postgres-only");
 const dbName="smn_restore_test_evidence_"+randomUUID().replaceAll("-","").slice(0,12);
 const url=new URL(raw);url.pathname="/"+dbName;
 const maintenance=new Client({connectionString:raw});
 const root=await mkdtemp(join(tmpdir(),"smn41-retention-"));
 let db:Client|null=null;
 try{
  await maintenance.connect();
  assert.match((await maintenance.query<{v:string}>(
   "SELECT current_setting('server_version') AS v")).rows[0].v,/^18\./);
  await maintenance.query('CREATE DATABASE "'+dbName+'"');
  db=new Client({connectionString:url.toString()});await db.connect();
  await db.query("CREATE TABLE public.smn_backup_retention_audit"+
   "(package_id uuid NOT NULL,action text NOT NULL)");
  const id=randomUUID();
  await mkdir(join(root,"packages",id),{recursive:true});
  assert.equal(await verifyRemovedRetentionPackage(db,root,id),false);
  await db.query("INSERT INTO public.smn_backup_retention_audit(package_id,action)"+
   " VALUES($1,'package_deleted')",[id]);
  assert.equal(await verifyRemovedRetentionPackage(db,root,id),false,
   "A SQL receipt alone must not imply filesystem deletion");
  await rm(join(root,"packages",id),{recursive:true});
  assert.equal(await verifyRemovedRetentionPackage(db,root,id),true);
  await db.query("INSERT INTO public.smn_backup_retention_audit(package_id,action)"+
   " VALUES($1,'package_deleted')",[id]);
  assert.equal(await verifyRemovedRetentionPackage(db,root,id),false,
   "Duplicated or ambiguous SQL receipts must not qualify");
  const pending=join(root,"packages",".retention-removing-"+id);
  await mkdir(pending);await writeFile(join(pending,"evidence.enc"),"unchanged");
  const artifacts=await inspectUnfinishedBackupArtifacts(root);
  assert.deepEqual(artifacts.retentionPendingIds,[id]);
  assert.equal(artifacts.stagingBackupIds.length,0);
  await assert.rejects(verifyRemovedRetentionPackage(db,root,"../bad-id"));
 }finally{
  if(db)await db.end().catch(()=>undefined);
  await maintenance.query('DROP DATABASE IF EXISTS "'+dbName+'" WITH (FORCE)')
   .catch(()=>undefined);
  await maintenance.end().catch(()=>undefined);
  await rm(root,{recursive:true,force:true});
 }
});
