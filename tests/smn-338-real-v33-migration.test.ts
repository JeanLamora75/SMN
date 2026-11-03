import {createV32RestorationSource} from "./helpers/v32-restoration-fixture";
import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {applyV33} from "../scripts/apply-smn-338-v33";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";

test("SMN-338 : migration versionnée v33 sur restauration complète isolée", {timeout:240000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const fixture=ci?await createV32RestorationSource(process.env.SMN_DATABASE_URL!):null;
 const uri=new URL(fixture?.uri??await installedDatabaseUri());
 if(!["postgres:","postgresql:"].includes(uri.protocol)||
   !["127.0.0.1","localhost","::1"].includes(uri.hostname)||(!fixture&&uri.pathname!=="/smn"))
  throw Error("Sécurité: la source doit être smn sur PostgreSQL local");
 const targetName="smn338_restaure_"+randomBytes(6).toString("hex");
 const adminUri=new URL(uri.toString());adminUri.pathname="/postgres";
 const targetUri=new URL(uri.toString());targetUri.pathname="/"+targetName;
 const env:NodeJS.ProcessEnv={...process.env,
  PGHOST:uri.hostname,PGPORT:uri.port||"5432",PGUSER:decodeURIComponent(uri.username),
  PGPASSWORD:decodeURIComponent(uri.password),PGDATABASE:"smn"};
 const temp=mkdtempSync(join(tmpdir(),"smn338-recovery-"));
 const backup=join(temp,"backup.dump");
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500,statement_timeout:25000});
 let created=false;
 function cli(bin:string,args:string[],database:string){
  const result=spawnSync(bin,args,{env:{...env,PGDATABASE:database},encoding:"utf8",
   windowsHide:true,timeout:120000,maxBuffer:4*1024*1024});
  if(result.error||result.status!==0)
   throw Error("Commande PostgreSQL échouée ("+bin+", code="+result.status+"): "+
    (result.error?.message||result.stderr.slice(0,600)));
 }
 try{
  await admin.connect();
  const connected=await admin.query("SELECT current_database() db,(SELECT rolcreatedb OR rolsuper FROM pg_roles WHERE rolname=current_user) allowed");
  assert.equal(connected.rows[0]?.db,"postgres");
  assert.equal(connected.rows[0]?.allowed,true,"Droit CREATEDB requis");
  const source=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500,statement_timeout:10000});
  await source.connect();
  try{
   await source.query("BEGIN TRANSACTION READ ONLY");
   const snapshot=await source.query("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'");
   const history=await source.query("SELECT count(*)::int total,count(*) FILTER(WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::int done FROM public._prisma_migrations");
   assert.equal(snapshot.rows[0]?.schema_version,32);
   assert.equal(snapshot.rows[0]?.state,"initialized");
   assert.ok((history.rows[0]?.total===32||history.rows[0]?.total===1)&&history.rows[0]?.done===history.rows[0]?.total);
   const existing=await source.query("SELECT count(*)::int n FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname LIKE 'smn_indicator_%'");
   assert.equal(existing.rows[0]?.n,0);
   await source.query("ROLLBACK");
  }finally{await source.end().catch(()=>undefined)}
  cli(process.env.SMN_PG_DUMP_PATH||"pg_dump",
   ["--format=custom","--no-owner","--no-privileges","--no-password","--file="+backup],"smn");
  await admin.query('CREATE DATABASE "'+targetName+'"');created=true;
  cli(process.env.SMN_PG_RESTORE_PATH||"pg_restore",
   ["--exit-on-error","--no-owner","--no-privileges","--no-password","--dbname="+targetName,backup],targetName);
  const db=new Client({connectionString:targetUri.toString(),connectionTimeoutMillis:3500,statement_timeout:60000});
  await db.connect();
  try{
   assert.equal((await db.query("SELECT current_database() db")).rows[0]?.db,targetName);
   const prior=await db.query("SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
   assert.equal(prior.rows[0]?.schema_version,32);
   const tablesBefore=await db.query("SELECT count(*)::int n FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r'");
   const teamBefore=await db.query("SELECT count(*)::int n FROM public.smn_team");
   const sprintBefore=await db.query("SELECT count(*)::int n FROM public.smn_sprint");
   const historyBefore=await db.query("SELECT count(*)::int n FROM public._prisma_migrations");
   const migrated=await applyV33(db,true);
   assert.equal(migrated.applied,true);
   const tablesAfter=await db.query("SELECT count(*)::int n FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r'");
   assert.equal(tablesAfter.rows[0]?.n,tablesBefore.rows[0]?.n+8);
   for(const [name,before] of [["smn_team",teamBefore.rows[0]?.n],["smn_sprint",sprintBefore.rows[0]?.n]] as const){
    const rows=await db.query("SELECT count(*)::int n FROM public."+name);
    assert.equal(rows.rows[0]?.n,before,name+" données conservées");
   }
   assert.equal((await db.query("SELECT count(*)::int n FROM public._prisma_migrations")).rows[0]?.n,historyBefore.rows[0]?.n+1);
   assert.equal((await db.query("SELECT schema_version FROM public.smn_installation WHERE id='singleton'")).rows[0]?.schema_version,33);
   const snapshot=await probePostgres(targetUri.toString());
   const diagnostic=classifySnapshot(snapshot);
   assert.equal(diagnostic.status,"initialized","Diagnostic après migration sur copie : "+
    JSON.stringify({indicatorV33SchemaValid:snapshot.indicatorV33SchemaValid,
      version:snapshot.installations?.[0]?.schema_version,
      migrations:snapshot.migrations?.length,
      unexpectedRelations:snapshot.tables.filter(t=>t.startsWith("public.smn_indicator_")),
      shapeValid:snapshot.shapeValid,teamAgileModeSchemaValid:snapshot.teamAgileModeSchemaValid}));
   console.log("Migration v33 réellement validée sur restauration isolée ; base temporaire supprimée.");

  }finally{await db.end().catch(()=>undefined)}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+targetName+'" WITH (FORCE)')}
  finally{await admin.end().catch(()=>undefined);rmSync(temp,{recursive:true,force:true});if(fixture)await fixture.dispose()}
 }
});
