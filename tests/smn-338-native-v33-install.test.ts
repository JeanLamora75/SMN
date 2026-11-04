import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";
import {INDICATOR_TABLES} from "../src/server/installation/indicator-v33-contract";
import {NATIVE_V33_NAME,nativeV33BaselineSql} from "../src/server/installation/native-v33";
import {createHash} from "node:crypto";
import {parseConnectionSettings} from "../src/server/db/config";
test("SMN-338 : installation native v33 complète sur base vierge isolée",{timeout:180000},async()=>{
 const source=new URL(await installedDatabaseUri());
 if(!["postgres:","postgresql:"].includes(source.protocol)||source.pathname!=="/smn"||
  !["localhost","127.0.0.1","::1"].includes(source.hostname))
  throw Error("Base SMN locale obligatoire");
 const name="smn_338_native_"+randomBytes(6).toString("hex");
 const adminUri=new URL(source.toString());adminUri.pathname="/postgres";
 const targetUri=new URL(source.toString());targetUri.pathname="/"+name;
 assert.equal(parseConnectionSettings(targetUri.toString()).ok,true,"URL de test conforme au contrat local SMN");
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500,statement_timeout:20000});
 let created=false;
 await admin.connect();
 try{
  const role=await admin.query("SELECT current_database() db,(SELECT rolcreatedb OR rolsuper FROM pg_roles WHERE rolname=current_user) can_create");
  assert.equal(role.rows[0]?.db,"postgres");
  assert.equal(role.rows[0]?.can_create,true,"CREATEDB requis");
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  const result=await installExpress({adminUsername:"admin338",adminEmail:"admin338@example.test",password:"test-only-338-password"},targetUri.toString());
  assert.deepEqual(result,{ok:true},"Le parcours d'installation native v33 doit réussir");
  const snapshot=await probePostgres(targetUri.toString());
  assert.equal(classifySnapshot(snapshot).status,"initialized");
  assert.equal(snapshot.installations?.[0]?.schema_version,33);
  assert.equal(snapshot.migrations?.length,1,"One canonical v33 baseline journal entry");
  assert.equal(snapshot.migrations?.[0]?.migration_name,NATIVE_V33_NAME);
  assert.equal(snapshot.migrations?.[0]?.checksum,createHash("sha256").update(nativeV33BaselineSql()!).digest("hex"));
  assert.equal(snapshot.migrations?.[0]?.rolled_back_at,null);
  const db=new Client({connectionString:targetUri.toString(),connectionTimeoutMillis:3500,statement_timeout:10000});
  await db.connect();
  try{
   const names=await db.query<{relname:string}>("SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname=ANY($1::text[])",[INDICATOR_TABLES]);
   assert.equal(names.rows.length,8);
   const adminCount=await db.query<{n:string}>("SELECT count(*)::text n FROM public.smn_account WHERE role='admin'");
   assert.equal(adminCount.rows[0]?.n,"1");
   const palette=await db.query<{palette:string}>("SELECT palette FROM public.smn_general_settings WHERE installation_id='singleton'");
   assert.equal(palette.rows[0]?.palette,"red-purple");
   const tables=await db.query<{name:string}>("SELECT relname name FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname=ANY($1::text[])",[["smn_indicator_team_grant","smn_indicator_dashboard_slot"]]);
   assert.equal(tables.rows.length,2);
   await db.query("ALTER TABLE public.smn_indicator_manual_value DISABLE TRIGGER smn_indicator_manual_value_integrity");
   assert.equal(classifySnapshot(await probePostgres(targetUri.toString())).status,"installation-incomplete",
    "Un trigger critique désactivé doit invalider le diagnostic v33");

  }finally{await db.end().catch(()=>undefined)}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)')}
  finally{await admin.end().catch(()=>undefined)}
 }
});
