import {Client} from "pg";
import {SMN35_ARCHIVE_IMMUTABILITY_SQL,SMN35_ARCHIVE_GUARD_CHECK_SQL}
 from "../src/server/backup/archive-immutability";

const apply=process.argv.includes("--apply");
const check=process.argv.includes("--check");
if((apply&&check)||process.argv.some(v=>v.startsWith("--")&&
 !["--apply","--check","--confirm=INSTALL_ARCHIVE_GUARDS"].includes(v))){
 process.stderr.write("Usage: pnpm exec tsx scripts/smn-35-archive-guards.ts --check|--apply --confirm=INSTALL_ARCHIVE_GUARDS\n");
 process.exitCode=2;
}else if(apply&&!process.argv.includes("--confirm=INSTALL_ARCHIVE_GUARDS")){
 process.stderr.write("Explicit confirmation required for additive archive guards.\n");
 process.exitCode=2;
}else{
 if(!process.env.SMN_DATABASE_URL&&!process.env.DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* Optional local file. */}
 }
 const uri=process.env.SMN_DATABASE_URL||process.env.DATABASE_URL||"";
 let valid=false;
 try{
  const url=new URL(uri);
  const name=decodeURIComponent(url.pathname.replace(/^\//,""));
  valid=["127.0.0.1","localhost","::1","[::1]"].includes(url.hostname)&&
   /^smn(?:_[a-zA-Z0-9_-]+)?$/.test(name)&&
   ["postgres:","postgresql:"].includes(url.protocol);
 }catch{/* No URL is echoed to protect secrets. */}
 if(!valid){
  process.stderr.write("Local SMN PostgreSQL URL required. No database was changed.\n");
  process.exitCode=2;
 }else{
  const client=new Client({connectionString:uri,connectionTimeoutMillis:3500,
   application_name:"smn-35-archive-guards",statement_timeout:12000});
  try{
   await client.connect();
   if(apply){
    await client.query("BEGIN");
    try{
     await client.query("SET LOCAL lock_timeout='3s'");
     await client.query(SMN35_ARCHIVE_IMMUTABILITY_SQL);
     const result=await client.query(SMN35_ARCHIVE_GUARD_CHECK_SQL);
     if(result.rows.length!==2||result.rows.some(row=>row.protected!==true))
      throw new Error("archive-guard-check-failed");
     await client.query("COMMIT");
    }catch(error){await client.query("ROLLBACK").catch(()=>undefined);throw error;}
   }
   const rows=await client.query(SMN35_ARCHIVE_GUARD_CHECK_SQL);
   for(const row of rows.rows){
    process.stdout.write(row.table_name+": "+(row.protected?"protected":"UNPROTECTED")+"\n");
   }
   if(rows.rows.length!==2||rows.rows.some(row=>row.protected!==true)){
    process.exitCode=1;
   }else process.stdout.write("SMN-35 archive guard check passed.\n");
  }catch{
   process.stderr.write("Archive guard operation failed. Check the local database and migration status.\n");
   process.exitCode=1;
  }finally{await client.end().catch(()=>undefined);}
 }
}
