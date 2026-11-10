import assert from "node:assert/strict";
import {test} from "node:test";
import {spawnSync} from "node:child_process";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,mkdir,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {Client} from "pg";

test("SMN-34 PG18: CLI externe coupe DB et fichiers jetables, conserve les deux rollback",
 {timeout:180000},async()=>{
 const maintenance=process.env.SMN_TEST_DATABASE_URL;
 if(!maintenance)throw Error("SMN_TEST_DATABASE_URL required");
 const parsed=new URL(maintenance);
 if(!["localhost","127.0.0.1","[::1]"].includes(parsed.hostname)||
  parsed.pathname!=="/postgres")throw Error("local disposable PG only");
 const id=randomUUID().replaceAll("-","").slice(0,12);
 const names={
  original:"smn_restore_test_orig_"+id,
  candidate:"smn_restore_test_cand_"+id,
  rollback:"smn_restore_test_back_"+id
 };
 const root=await mkdtemp(join(tmpdir(),"smn34-operator-"));
 const paths={
  originalRoot:join(root,"smn_restore_test_original"),
  candidateRoot:join(root,"smn_restore_test_candidate"),
  rollbackRoot:join(root,"smn_restore_test_rollback"),
  recoveredFilesRoot:join(root,"smn_restore_test_recovered")
 };
 const admin=new Client({connectionString:maintenance});
 const created:string[]=[];
 const uri=(name:string)=>{const u=new URL(maintenance);u.pathname="/"+name;return u.toString();};
 const marker=async(name:string)=>{
  const db=new Client({connectionString:uri(name)});
  try{await db.connect();return (await db.query<{value:string}>(
   "SELECT value FROM public.restore_marker")).rows[0].value;}
  finally{await db.end();}
 };
 try{
  await admin.connect();
  for(const name of [names.original,names.candidate]){
   await admin.query('CREATE DATABASE "'+name+'"');created.push(name);
  }
  for(const [name,value] of [[names.original,"original"],[names.candidate,"candidate"]] as const){
   const db=new Client({connectionString:uri(name)});
   try{await db.connect();
    await db.query("CREATE TABLE public.restore_marker(value text)");
    await db.query("INSERT INTO public.restore_marker(value) VALUES($1)",[value]);
   }finally{await db.end();}
  }
  for(const [path,value] of [[paths.originalRoot,"original"],[paths.candidateRoot,"candidate"]] as const){
   await mkdir(join(path,"documents"),{recursive:true});
   await writeFile(join(path,"documents","marker.txt"),value);
  }
  const script=fileURLToPath(new URL("../scripts/smn-34-offline-cutover-sandbox.ts",import.meta.url));
  const output=spawnSync(process.execPath,["--import","tsx",script,
   "--sandbox-cutover",names.original,names.candidate,names.rollback,
   paths.originalRoot,paths.candidateRoot,paths.rollbackRoot,
   paths.recoveredFilesRoot,root],{
   cwd:fileURLToPath(new URL("../",import.meta.url)),
   encoding:"utf8",timeout:80000,env:{
    ...process.env,SMN_TEST_DATABASE_URL:maintenance,
    SMN_CUTOVER_TEST_AUDIT_KEY_HEX:randomBytes(32).toString("hex")
   }
  });
  assert.equal(output.status,0,output.stderr);
  const result=JSON.parse(output.stdout);
  assert.deepEqual(result,{
   mode:"disposable-sandbox-only",state:"verified",
   databaseRollbackPreserved:true,filesRollbackPreserved:true,
   productionRestoreEnabled:false
  });
  assert.equal(await marker(names.original),"candidate");
  assert.equal(await marker(names.rollback),"original");
  assert.equal(await readFile(join(paths.originalRoot,"documents","marker.txt"),"utf8"),
   "candidate");
  assert.equal(await readFile(join(paths.rollbackRoot,"documents","marker.txt"),"utf8"),
   "original");
 }finally{
  for(const name of [...created,names.rollback])
   await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)').catch(()=>undefined);
  await admin.end().catch(()=>undefined);
  await rm(root,{recursive:true,force:true});
 }
});
