/**
 * Explicit additive maintenance for a native v33 installation.
 * Check mode is read only. Apply mode requires a human confirmation and an
 * independently verified backup; it never runs during application startup.
 */
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {MEMBER_REMOVAL_AUDIT_SQL} from "../src/server/members/removal-audit";

const migrations=[
 "20261109_smn39_privacy_receipt",
 "20261109_smn39_archive_restriction",
 "20261109_smn40_member_delete_guard"
] as const;
const confirm="--confirm=INSTALL_SENSITIVE_PRIVACY_GUARDS";
const backup="--backup-verified=YES";
export function parseMaintenanceArgs(args:readonly string[]){
 const mode=args[0];
 if(mode==="--check"&&args.length===1)return "check";
 if(mode==="--apply"&&args.length===3&&args.includes(confirm)&&args.includes(backup))
  return "apply";
 throw Error("maintenance-arguments-invalid");
}
function safeLocalDatabase(uri:string):boolean{
 try{
  const x=new URL(uri);
  const name=decodeURIComponent(x.pathname.slice(1));
  return ["postgres:","postgresql:"].includes(x.protocol)&&
   ["localhost","127.0.0.1","::1","[::1]"].includes(x.hostname)&&
   /^smn(?:_[a-z0-9_-]+)?$/i.test(name)&&
   x.username.length>0&&x.password.length>0;
 }catch{return false;}
}
export async function inspectPrivacySchema(db:Pick<Client,"query">){
 const checks=await db.query<{
  schema_version:number;receipt:boolean;receipt_immutable:boolean;
  archive_restriction:boolean;archive_immutable:boolean;
  member_audit:boolean;member_audit_immutable:boolean;delete_guard:boolean
 }>(`
 SELECT
  (SELECT schema_version FROM public.smn_installation WHERE id='singleton') AS schema_version,
  to_regclass('public.smn_privacy_erasure_receipt') IS NOT NULL AS receipt,
  EXISTS(SELECT 1 FROM pg_catalog.pg_trigger
   WHERE tgrelid=to_regclass('public.smn_privacy_erasure_receipt')
    AND tgname='smn_privacy_erasure_receipt_immutable' AND tgenabled IN ('O','A')
    AND tgfoid=to_regprocedure('public.smn_privacy_receipt_immutable()')) AS receipt_immutable,
  to_regclass('public.smn_privacy_archive_restriction') IS NOT NULL AS archive_restriction,
  EXISTS(SELECT 1 FROM pg_catalog.pg_trigger
   WHERE tgrelid=to_regclass('public.smn_privacy_archive_restriction')
    AND tgname='smn_privacy_archive_restriction_immutable' AND tgenabled IN ('O','A')
    AND tgfoid=to_regprocedure('public.smn_privacy_archive_restriction_immutable()')) AS archive_immutable,
  to_regclass('public.smn_member_removal_audit') IS NOT NULL AS member_audit,
  EXISTS(SELECT 1 FROM pg_catalog.pg_trigger
   WHERE tgrelid=to_regclass('public.smn_member_removal_audit')
    AND tgname='smn36_removal_audit_immutable' AND tgenabled IN ('O','A')
    AND tgfoid=to_regprocedure('public.smn36_refuse_removal_audit_mutation()')) AS member_audit_immutable,
  EXISTS(SELECT 1 FROM pg_catalog.pg_trigger
   WHERE tgrelid=to_regclass('public.smn_member')
    AND tgname='smn40_member_delete_guard' AND tgenabled IN ('O','A')
    AND tgfoid=to_regprocedure('public.smn40_guard_member_delete()')) AS delete_guard
 `);
 const state=checks.rows[0];
 if(!state||state.schema_version!==33)throw Error("maintenance-schema-not-v33");
 return state;
}
async function main(){
 const mode=parseMaintenanceArgs(process.argv.slice(2));
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const uri=await installedDatabaseUri();
 if(!safeLocalDatabase(uri))throw Error("maintenance-database-not-eligible");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:30000,application_name:"smn40-explicit-maintenance"});
 try{
  await db.connect();
  if(mode==="check"){
   await db.query("BEGIN READ ONLY");
   try{
    const before=await inspectPrivacySchema(db);
    process.stdout.write(JSON.stringify({mode,applied:false,state:before})+"\n");
   }finally{await db.query("ROLLBACK").catch(()=>undefined);}
   return;
  }
  // The confirmation is only an execution gate, not a proof of historical privacy.
  await db.query("BEGIN");
  try{
   await db.query("SET LOCAL lock_timeout='3s'");
   const before=await inspectPrivacySchema(db);
   if(before.delete_guard&&!before.receipt)
    throw Error("maintenance-existing-guard-inconsistent");
   await db.query(MEMBER_REMOVAL_AUDIT_SQL);
   for(const name of migrations){
    const sql=readFileSync(new URL("../prisma/migrations/"+name+"/migration.sql",
     import.meta.url),"utf8");
    await db.query(sql);
   }
   const after=await inspectPrivacySchema(db);
   if(![after.receipt,after.receipt_immutable,after.archive_restriction,
    after.archive_immutable,after.member_audit,after.member_audit_immutable,
    after.delete_guard].every(Boolean))throw Error("maintenance-postcheck-failed");
   await db.query("COMMIT");
   process.stdout.write(JSON.stringify({mode,applied:true,state:after})+"\n");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end().catch(()=>undefined);}
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/smn-40-maintenance.ts"))
 main().catch(()=>{process.stderr.write("SMN-40 maintenance failed (no sensitive details logged).\n");process.exitCode=1;});
