import {randomBytes,createHash} from "node:crypto";
import {Client} from "pg";
import {readFileSync} from "node:fs";
import {paletteMigrationBody} from "./apply-red-purple-migration";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {nativeBaselineSql,NATIVE_V32_NAME} from "../src/server/installation/native-v32";
import {applyV33} from "./apply-smn-338-v33";
import {compareSignatures,readSchema} from "./smn-351-schema-compare";
export function assertSafeSource(uri:string){
 const u=new URL(uri);
 if(!["postgres:","postgresql:"].includes(u.protocol)||!["127.0.0.1","localhost","::1"].includes(u.hostname)||u.pathname!=="/smn")throw Error("Refus: connexion SMN locale requise");
 return u;
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")throw Error("Usage: pnpm db:compare:smn-351:auto");
 const source=assertSafeSource(await installedDatabaseUri());
 const adminUri=new URL(source);adminUri.pathname="/postgres";
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 const suffix=randomBytes(6).toString("hex");
 const fresh="smn_351_fresh_"+suffix,migrated="smn_351_migrated_"+suffix;
 const owned:string[]=[];
 const uri=(name:string)=>{const u=new URL(source);u.pathname="/"+name;return u.toString();};
 await admin.connect();
 try{
  const meta=await admin.query<{db:string;allowed:boolean}>("SELECT current_database() db,(SELECT rolcreatedb OR rolsuper FROM pg_roles WHERE rolname=current_user) allowed");
  if(meta.rows[0]?.db!=="postgres"||meta.rows[0]?.allowed!==true)throw Error("CREATEDB requis sur le serveur local");
  const base=nativeBaselineSql();if(!base)throw Error("Baseline native v32 manquante");
  for(const name of [fresh,migrated]){
   await admin.query('CREATE DATABASE "'+name+'"');owned.push(name);
  }
  const result=await installExpress({adminUsername:"smn351test",adminEmail:"smn351@example.test",password:"SMN351-test-password-long-2026"},uri(fresh));
  if(!result.ok)throw Error("Installation native v33 impossible: "+result.status);
  const db=new Client({connectionString:uri(migrated),connectionTimeoutMillis:3500,statement_timeout:60000});
  await db.connect();
  try{
   await db.query("BEGIN");
   try{
    await db.query(base);
    await db.query("INSERT INTO public.smn_installation(id,state,schema_version) VALUES('singleton','initialized',32)");
    await db.query("INSERT INTO public._prisma_migrations(id,checksum,finished_at,migration_name,applied_steps_count) VALUES($1,$2,now(),$3,1)",[randomBytes(16).toString("hex"),createHash("sha256").update(base).digest("hex"),NATIVE_V32_NAME]);
    await db.query("COMMIT");
   }catch(e){await db.query("ROLLBACK");throw e;}
   await applyV33(db,true);
   // Apply the same additive post-baseline contracts as native v33 installation.
   const paletteSql=readFileSync(new URL("../prisma/migrations/20261031_red_purple_palette/migration.sql",import.meta.url),"utf8");
   const grantsSql=readFileSync(new URL("../prisma/migrations/20261101_smn347_team_grants/migration.sql",import.meta.url),"utf8");
   await db.query("BEGIN");
   try{
    await db.query(paletteMigrationBody(paletteSql));
    await db.query(grantsSql);
    await db.query("COMMIT");
   }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
  }finally{await db.end();}
  const read=async(name:string)=>{const c=new Client({connectionString:uri(name),connectionTimeoutMillis:3500});await c.connect();try{return await readSchema(c);}finally{await c.end();}};
  const [left,right]=await Promise.all([read(fresh),read(migrated)]);
  const compared=compareSignatures(left,right);
  console.log(JSON.stringify({simulation:true,destructiveOperationOnUserDatabase:false,freshOrigin:"native-v33",migratedOrigin:"native-v32-plus-v33-migration",freshCount:left.length,migratedCount:right.length,...compared,cleanupAuthorized:false},null,2));
  if(!compared.identical)process.exitCode=2;
 }finally{
  for(const name of owned.reverse()){
   if(!/^smn_351_(fresh|migrated)_[a-f0-9]{12}$/.test(name))throw Error("Unsafe cleanup target");
   await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');
  }
  await admin.end();
 }
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/").endsWith("/smn-351-auto-compare.ts"))main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
