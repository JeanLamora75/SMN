import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,mkdir,writeFile,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Client} from "pg";
import {rehearseCoordinatedOfflineCutover} from "../src/server/backup/restore-coordinated-drill";
import {qualifyRecoveryDrill} from "../src/server/backup/recovery-drill-measurement";
import {SessionStore} from "../src/server/auth/session-store";

test("SMN-34 real PG18 and files: coordinated offline cutover with rollback",
 {timeout:120000},async()=>{
 const maintenance=process.env.SMN_TEST_DATABASE_URL;
 if(!maintenance)throw Error("SMN_TEST_DATABASE_URL required");
 const u=new URL(maintenance);
 if(!["localhost","127.0.0.1","[::1]"].includes(u.hostname)||u.pathname!=="/postgres")
  throw Error("Local disposable maintenance connection required");
 const name=randomUUID().replaceAll("-","").slice(0,12);
 const names={
  original:"smn_restore_test_orig_"+name,
  candidate:"smn_restore_test_cand_"+name,
  rollback:"smn_restore_test_back_"+name
 };
 const root=await mkdtemp(join(tmpdir(),"smn-34-coordinated-"));
 const paths={
  originalRoot:join(root,"smn_restore_test_original"),
  candidateRoot:join(root,"smn_restore_test_candidate"),
  rollbackRoot:join(root,"smn_restore_test_rollback")
 };
 const admin=new Client({connectionString:maintenance});
 const owned:string[]=[];
 const url=(db:string)=>{const v=new URL(maintenance);v.pathname="/"+db;return v.toString();};
 const fileData=async(dir:string,value:string)=>{
  await mkdir(join(dir,"documents"),{recursive:true});
  await writeFile(join(dir,"documents","record.txt"),value);
 };
 try{
  await admin.connect();
  const version=await admin.query<{v:string}>(
   "SELECT current_setting('server_version') AS v");
  assert.match(version.rows[0].v,/^18\./);
  for(const n of [names.original,names.candidate]){
   await admin.query('CREATE DATABASE "'+n+'"');owned.push(n);
  }
  for(const [db,value] of [[names.original,"original"],[names.candidate,"restored"]] as const){
   const client=new Client({connectionString:url(db)});
   try{
    await client.connect();
    await client.query("CREATE TABLE public.restore_marker(value text PRIMARY KEY)");
    await client.query("INSERT INTO public.restore_marker(value) VALUES($1)",[value]);
   }finally{await client.end();}
  }
  await fileData(paths.originalRoot,"original");
  await fileData(paths.candidateRoot,"restored");
  const trialStarted=new Date().toISOString();
  const result=await rehearseCoordinatedOfflineCutover({
   database:{maintenanceUri:maintenance,...names,journalDir:root,
    auditKeyHex:randomBytes(32).toString("hex")},
   files:paths,recoveredFilesRoot:join(root,"smn_restore_test_recovered")
  });
  assert.equal(result.state,"verified");
  assert.equal(result.databaseRollbackPreserved,true);
  assert.equal(result.filesRollbackPreserved,true);
  const checkDb=async(n:string)=>{
   const db=new Client({connectionString:url(n)});
   try{await db.connect();return (await db.query<{value:string}>(
    "SELECT value FROM public.restore_marker")).rows[0].value;}
   finally{await db.end();}
  };
  assert.equal(await checkDb(names.original),"restored");
  assert.equal(await checkDb(names.rollback),"original");
  assert.equal(await readFile(join(paths.originalRoot,"documents","record.txt"),"utf8"),
   "restored");
  assert.equal(await readFile(join(paths.rollbackRoot,"documents","record.txt"),"utf8"),
   "original");
  // Session revocation is demonstrated on an isolated ephemeral store;
  // it cannot validate the persistent production session service.
  const sessions=new SessionStore();
  const token=sessions.issue("test-admin","fingerprint",1000,"admin");
  assert.ok(sessions.get(token,1100));
  assert.equal(sessions.revokeAll(),1);
  assert.equal(sessions.get(token,1100),null);
  const qualified=qualifyRecoveryDrill({
   mode:"restore",startedAt:trialStarted,verifiedAt:new Date().toISOString(),
   databaseMatchesExpected:true,filesMatchExpected:true,
   rollbackDatabaseVerified:true,rollbackFilesVerified:true,
   journalVerified:true,sessionRevocationVerified:true
  });
  assert.equal(qualified.status,"verified");
  assert.ok(qualified.measuredCutoverMinutes!==null);
  assert.equal(qualified.productionRtoMinutes,null);
  assert.equal(qualified.productionRpoMinutes,null);

  // Inject a crash AFTER original DB has been parked. The two resources
  // must return to original state, retaining the candidate for inspection.
  const restoredCandidateDb="smn_restore_test_next_"+name;
  const recoveredDb="smn_restore_test_reco_"+name;
  await admin.query('CREATE DATABASE "'+restoredCandidateDb+'"');owned.push(restoredCandidateDb);
  const next=new Client({connectionString:url(restoredCandidateDb)});
  try{
   await next.connect();
   await next.query("CREATE TABLE public.restore_marker(value text PRIMARY KEY)");
   await next.query("INSERT INTO public.restore_marker(value) VALUES('candidate-failure')");
  }finally{await next.end();}
  const newCandidate=join(root,"smn_restore_test_nextfiles");
  await fileData(newCandidate,"candidate-failure");
  const crashed=await rehearseCoordinatedOfflineCutover({
   database:{
    maintenanceUri:maintenance,original:names.original,
    candidate:restoredCandidateDb,rollback:recoveredDb,
    journalDir:root,auditKeyHex:randomBytes(32).toString("hex"),
    injectFailureAfterPark:true
   },
   files:{
    originalRoot:paths.originalRoot,candidateRoot:newCandidate,
    rollbackRoot:join(root,"smn_restore_test_fbackup")
   },
   recoveredFilesRoot:join(root,"smn_restore_test_recovered2")
  });
  assert.equal(crashed.state,"rolled-back");
  assert.equal(await checkDb(names.original),"restored");
  assert.equal(await checkDb(restoredCandidateDb),"candidate-failure");
  assert.equal(await readFile(join(paths.originalRoot,"documents","record.txt"),"utf8"),
   "restored");
  // A failure after promotion is compensated only after verified disposable
  // database state checks. The file cutover must then reverse as well.
  const postRollbackDb="smn_restore_test_post_"+name;
  const postCandidateFiles=join(root,"smn_restore_test_postfiles");
  const postFileRollback=join(root,"smn_restore_test_postback");
  await fileData(postCandidateFiles,"post-promotion-candidate");
  const afterPromotion=await rehearseCoordinatedOfflineCutover({
   database:{
    maintenanceUri:maintenance,original:names.original,
    candidate:restoredCandidateDb,rollback:postRollbackDb,
    journalDir:root,auditKeyHex:randomBytes(32).toString("hex"),
    injectFailureAfterPromotion:true
   },
   files:{
    originalRoot:paths.originalRoot,candidateRoot:postCandidateFiles,
    rollbackRoot:postFileRollback
   },
   recoveredFilesRoot:join(root,"smn_restore_test_postrecovered")
  });
  assert.equal(afterPromotion.state,"rolled-back");
  assert.equal(await checkDb(names.original),"restored");
  assert.equal(await checkDb(restoredCandidateDb),"candidate-failure");
  assert.equal(await readFile(join(paths.originalRoot,"documents","record.txt"),"utf8"),
   "restored");
  assert.equal(await readFile(join(root,"smn_restore_test_postrecovered",
   "documents","record.txt"),"utf8"),"post-promotion-candidate");
  process.stdout.write("SMN34-COORDINATED: DB and files consistent; injected failure recovered\n");
 }finally{
  for(const n of [...owned,names.rollback]){
   await admin.query('DROP DATABASE IF EXISTS "'+n+'" WITH (FORCE)').catch(()=>undefined);
  }
  await admin.end().catch(()=>undefined);
  await rm(root,{recursive:true,force:true});
 }
});
