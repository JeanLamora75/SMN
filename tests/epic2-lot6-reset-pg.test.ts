import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,rm,mkdir,writeFile,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {provisionIndependentResetCandidate} from "../src/server/installation/reset-independent";
import {previewInstallationReset} from "../src/server/installation/reset-preview";
import {rehearseCoordinatedOfflineCutover} from "../src/server/backup/restore-coordinated-drill";
import {inspectRestoreFileTree} from "../src/server/backup/restore-file-cutover-drill";

test("SMN-37 PG18 : une installation vierge indépendante conserve la source et sa reprise",
 {timeout:180000},async()=>{
 const raw=process.env.SMN_TEST_DATABASE_URL;
 if(!raw)throw Error("disposable-test-database-required");
 const uri=new URL(raw);
 if(!["127.0.0.1","localhost","[::1]"].includes(uri.hostname)||
  uri.pathname!=="/postgres")throw Error("local-maintenance-only");
 const suffix=randomUUID().replaceAll("-","").slice(0,12);
 const source="smn_restore_test_source_"+suffix;
 const fresh="smn_restore_test_fresh_"+suffix;
 const previous="smn_restore_test_prevs_"+suffix;
 const dbUrl=(n:string)=>{const u=new URL(raw);u.pathname="/"+n;return u.toString();};
 const admin=new Client({connectionString:raw});
 const dir=await mkdtemp(join(tmpdir(),"smn37-independence-"));
 const envNames=["SMN_DATABASE_URL","SMN_BACKUP_DIR","SMN_PRIVATE_DOCUMENTS_DIR",
  "SMN_PRIVATE_REPORT_ARCHIVE_DIR","SMN_OFFICE_REPORTS_DIR",
  "SMN_OFFICE_TEMPLATES_DIR"] as const;
 const previousEnvironment=envNames.map(n=>process.env[n]);
 let sourceDb:Client|null=null;
 try{
  await admin.connect();
  const version=await admin.query<{v:string}>("SELECT current_setting('server_version') AS v");
  assert.match(version.rows[0].v,/^18\./);
  await admin.query('CREATE DATABASE "'+source+'"');
  await admin.query('CREATE DATABASE "'+fresh+'"');
  assert.deepEqual(await installExpress({
   adminUsername:"original",adminEmail:"original@example.test",
   password:"ExampleTestOriginal2026!"
  },dbUrl(source)),{ok:true});
  sourceDb=new Client({connectionString:dbUrl(source)});
  await sourceDb.connect();
  const team=randomUUID();
  await sourceDb.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) "+
   "VALUES($1,'singleton','Team A','scrum')",[team]);
  const before=await sourceDb.query<{name:string}>(
   "SELECT name FROM public.smn_team WHERE id=$1",[team]);
  assert.equal(before.rows[0]?.name,"Team A");
  await sourceDb.end();sourceDb=null;
  process.env.SMN_DATABASE_URL=dbUrl(source);
  process.env.SMN_BACKUP_DIR=join(dir,"backups");
  process.env.SMN_PRIVATE_DOCUMENTS_DIR=join(dir,"private");
  process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR=join(dir,"pdf");
  process.env.SMN_OFFICE_REPORTS_DIR=join(dir,"office");
  process.env.SMN_OFFICE_TEMPLATES_DIR=join(dir,"templates");
  for(const folder of ["backups","private","pdf","office","templates"])
   await mkdir(join(dir,folder),{recursive:true});
  const impact=await previewInstallationReset();
  assert.equal(impact.database.estimatesOnly,false);
  assert.equal(impact.database.complete,true);
  assert.ok(impact.database.examples.some(t=>t.table==="smn_team"&&t.estimatedRows===1));
  assert.equal(impact.archives.state,"verified");
  assert.equal(impact.archives.reportPdfs,0);
  assert.equal(impact.canExecute,false);

  await assert.rejects(provisionIndependentResetCandidate({
   sourceUri:dbUrl(source),candidateUri:dbUrl(source),
   administrator:{adminUsername:"fresh",adminEmail:"fresh@example.test",
    password:"ExampleTestFresh2026!"}
  }),/reset-candidate-not-disposable/);
  const result=await provisionIndependentResetCandidate({
   sourceUri:dbUrl(source),candidateUri:dbUrl(fresh),
   administrator:{adminUsername:"fresh",adminEmail:"fresh@example.test",
    password:"ExampleTestFresh2026!"}
  });
  assert.equal(result.status,"independent-installation-verified");
  assert.equal(result.sourceUnchanged,true);
  assert.equal(result.candidateIsolated,true);
  assert.ok(result.tablesChecked>50);
  assert.equal(result.newTeams,0);
  const sourceCheck=new Client({connectionString:dbUrl(source)});
  const freshCheck=new Client({connectionString:dbUrl(fresh)});
  try{
   await sourceCheck.connect();await freshCheck.connect();
   assert.equal((await sourceCheck.query("SELECT * FROM public.smn_team WHERE id=$1",[team]))
    .rows.length,1);
   assert.equal((await freshCheck.query("SELECT 1 FROM public.smn_team")).rows.length,0);
   const account=await freshCheck.query<{username:string}>(
    "SELECT username FROM public.smn_account WHERE role='admin'");
   assert.equal(account.rows[0].username,"fresh");
  }finally{await sourceCheck.end();await freshCheck.end();}
  // Simulate reset of the FOUR managed file scopes, including an empty
  // destination: old private data must remain in a separate rollback root.
  const fileOld=join(dir,"smn_restore_test_oldfiles");
  const fileNew=join(dir,"smn_restore_test_newfiles");
  const fileRollback=join(dir,"smn_restore_test_oldbackup");
  for(const root of [fileOld,fileNew])
   for(const kind of ["documents","report-pdfs","office-reports","office-templates"])
    await mkdir(join(root,kind),{recursive:true});
  await writeFile(join(fileOld,"documents","private.txt"),"original-private-data");
  await writeFile(join(fileOld,"office-reports","report.docx"),"old-report");
  const swapped=await rehearseCoordinatedOfflineCutover({
   database:{
    maintenanceUri:raw,original:source,candidate:fresh,rollback:previous,
    journalDir:dir,auditKeyHex:randomBytes(32).toString("hex")
   },
   files:{
    originalRoot:fileOld,candidateRoot:fileNew,rollbackRoot:fileRollback,
    allowVerifiedEmptyCandidate:true
   },
   recoveredFilesRoot:join(dir,"smn_restore_test_recovered")
  });
  assert.equal(swapped.state,"verified");
  assert.equal(swapped.databaseRollbackPreserved,true);
  assert.equal(swapped.filesRollbackPreserved,true);
  assert.equal((await inspectRestoreFileTree(fileOld)).count,0);
  assert.equal(await readFile(join(fileRollback,"documents","private.txt"),"utf8"),
   "original-private-data");
  assert.equal(await readFile(join(fileRollback,"office-reports","report.docx"),"utf8"),
   "old-report");
  const verifyNew=new Client({connectionString:dbUrl(source)});
  const verifyRollback=new Client({connectionString:dbUrl(previous)});
  try{
   await verifyNew.connect();await verifyRollback.connect();
   assert.equal((await verifyNew.query("SELECT 1 FROM public.smn_team")).rows.length,0);
   assert.equal((await verifyRollback.query(
    "SELECT name FROM public.smn_team WHERE id=$1",[team])).rows[0].name,"Team A");
  }finally{await verifyNew.end();await verifyRollback.end();}
  process.stdout.write("SMN37-PG18: native v33 reset candidate, source retained, rollback verified\n");
 }finally{
  for(const [index,key] of envNames.entries()){
   if(previousEnvironment[index]===undefined)delete process.env[key];
   else process.env[key]=previousEnvironment[index];
  }
  if(sourceDb)await sourceDb.end().catch(()=>undefined);
  for(const name of [source,fresh,previous])
   await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)')
    .catch(()=>undefined);
  await admin.end().catch(()=>undefined);
  await rm(dir,{recursive:true,force:true});
 }
});
