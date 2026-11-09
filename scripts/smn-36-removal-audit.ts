import {Client} from "pg";
import {MEMBER_REMOVAL_AUDIT_SQL} from "../src/server/members/removal-audit";

const check=process.argv.includes("--check"),apply=process.argv.includes("--apply");
const confirmed=process.argv.includes("--confirm=INSTALL_MEMBER_REMOVAL_AUDIT");
if(check===apply||apply&&!confirmed||process.argv.some(s=>s.startsWith("--")&&
 !["--check","--apply","--confirm=INSTALL_MEMBER_REMOVAL_AUDIT"].includes(s))){
 process.stderr.write("Usage: pnpm exec tsx scripts/smn-36-removal-audit.ts --check|--apply --confirm=INSTALL_MEMBER_REMOVAL_AUDIT\n");
 process.exitCode=2;
}else{
 if(!process.env.SMN_DATABASE_URL&&!process.env.DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* local file optional */}
 }
 const uri=process.env.SMN_DATABASE_URL??process.env.DATABASE_URL??"";
 let safe=false;
 try{
  const url=new URL(uri),name=decodeURIComponent(url.pathname.slice(1));
  safe=["127.0.0.1","localhost","::1","[::1]"].includes(url.hostname)&&
   ["postgres:","postgresql:"].includes(url.protocol)&&
   /^smn(?:_[a-z0-9_-]+)?$/i.test(name);
 }catch{/* Do not print credentials */}
 if(!safe){
  process.stderr.write("A local SMN PostgreSQL URL is required. No changes made.\n");
  process.exitCode=2;
 }else{
  const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
   application_name:"smn-36-audit-migration",statement_timeout:12000});
  try{
   await db.connect();
   if(apply){
    await db.query("BEGIN");
    try{
     await db.query("SET LOCAL lock_timeout='3s'");
     await db.query(MEMBER_REMOVAL_AUDIT_SQL);
     await db.query("COMMIT");
    }catch(error){
     await db.query("ROLLBACK").catch(()=>undefined);throw error;
    }
   }
   const status=await db.query<{ready:boolean}>(`
    SELECT to_regclass('public.smn_member_removal_audit') IS NOT NULL AS ready`);
   if(status.rows[0]?.ready!==true){
    process.stdout.write("SMN-36 removal audit: NOT INSTALLED\n");process.exitCode=1;
   }else process.stdout.write("SMN-36 removal audit: INSTALLED\n");
  }catch{
   process.stderr.write("SMN-36 audit migration unavailable; no success claimed.\n");
   process.exitCode=1;
  }finally{await db.end().catch(()=>undefined);}
 }
}
