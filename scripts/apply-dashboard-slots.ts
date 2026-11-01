import {Client} from "pg";
import {readFileSync} from "node:fs";
import {createHash,randomUUID} from "node:crypto";
import {installedDatabaseUri} from "../src/server/auth/database";
export const DASHBOARD_SLOTS_MIGRATION="20261101_smn_dashboard_slots_additive";
export async function applyDashboardSlots(db:Client,apply:boolean){
 await db.query(apply?"BEGIN":"BEGIN READ ONLY");
 try{
  if(apply)await db.query("SELECT pg_advisory_xact_lock(20261101,401)");
  const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'"+(apply?" FOR UPDATE":""));
  if(state.rows[0]?.schema_version!==33||state.rows[0].state!=="initialized")throw Error("schema-v33-required");
  const present=await db.query<{exists:boolean}>("SELECT to_regclass('public.smn_indicator_dashboard_slot') IS NOT NULL AS exists");
  if(present.rows[0]?.exists){await db.query("ROLLBACK");return {ready:true,applied:false,alreadyInstalled:true};}
  if(!apply){await db.query("ROLLBACK");return {ready:true,applied:false,alreadyInstalled:false};}
  const sql=readFileSync(new URL("../prisma/migrations/20261101_smn_dashboard_slots_additive/migration.sql",import.meta.url),"utf8");
  await db.query(sql);
  await db.query("INSERT INTO public._prisma_migrations(id,checksum,finished_at,migration_name,applied_steps_count) VALUES($1,$2,now(),$3,1)",[randomUUID(),createHash("sha256").update(sql).digest("hex"),DASHBOARD_SLOTS_MIGRATION]);
  await db.query("COMMIT");
  return {ready:true,applied:true,alreadyInstalled:false};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
async function main(){
 const mode=process.argv[2];
 if(!["--check","--apply"].includes(mode)||process.argv.length!==3)throw Error("Usage: pnpm exec tsx scripts/apply-dashboard-slots.ts --check|--apply");
 if(mode==="--apply"&&process.env.SMN_V33_BACKUP_VERIFIED!=="YES")throw Error("Backup verified flag required");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{console.log(JSON.stringify(await applyDashboardSlots(db,mode==="--apply"),null,2));}finally{await db.end();}
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/apply-dashboard-slots.ts"))main().catch(e=>{console.error(e);process.exitCode=1;});
