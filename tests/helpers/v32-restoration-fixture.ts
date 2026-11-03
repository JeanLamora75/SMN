import {randomBytes,createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {NATIVE_V32_NAME} from "../../src/server/installation/native-v32";

/** A disposable and complete v32 source: never modifies the application's installed database.
 * This is used only in CI because a developer may already have an actual validated v32 source.
 */
export async function createV32RestorationSource(original:string):Promise<{uri:string;dispose:()=>Promise<void>}>{
 const origin=new URL(original);
 if(!["127.0.0.1","localhost","[::1]"].includes(origin.hostname))
  throw Error("v32-restoration-fixture: local PostgreSQL required");
 const sourceName="smn338_source_"+randomBytes(6).toString("hex");
 const adminUri=new URL(origin);adminUri.pathname="/postgres";
 const sourceUri=new URL(origin);sourceUri.pathname="/"+sourceName;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();
 let created=false;
 try{
  await admin.query('CREATE DATABASE "'+sourceName+'"');created=true;
  const db=new Client({connectionString:sourceUri.toString(),connectionTimeoutMillis:3500,statement_timeout:120000});
  await db.connect();
  try{
   const sql=readFileSync(new URL("../../prisma/baseline/v32/schema.sql",import.meta.url),"utf8");
   await db.query(sql);
   await db.query("INSERT INTO public.smn_installation(id,state,schema_version) VALUES('singleton','initialized',32)");
   await db.query(`INSERT INTO public._prisma_migrations
    (id,checksum,finished_at,migration_name,applied_steps_count)
    VALUES($1,$2,now(),$3,1)`,[randomUUID(),createHash("sha256").update(sql).digest("hex"),NATIVE_V32_NAME]);
   const installed=await db.query<{version:number;history:string}>(`SELECT
     (SELECT schema_version FROM public.smn_installation WHERE id='singleton') AS version,
     (SELECT count(*)::text FROM public._prisma_migrations) AS history`);
   if(installed.rows[0]?.version!==32||installed.rows[0]?.history!=="1")
    throw Error("v32-restoration-fixture: baseline verification failed");
  }finally{await db.end();}
  return {uri:sourceUri.toString(),dispose:async()=>{try{await admin.query('DROP DATABASE "'+sourceName+'" WITH (FORCE)')}finally{await admin.end()}}};
 }catch(e){
  try{if(created)await admin.query('DROP DATABASE "'+sourceName+'" WITH (FORCE)')}
  finally{await admin.end().catch(()=>undefined)}
  throw e;
 }
}
