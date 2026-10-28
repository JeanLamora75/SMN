import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {ensureCapacityRecalcOutbox} from "../src/server/capacity/company-recalc-outbox";
import {processCompanyRecalculation} from "../src/server/capacity/company-recalc-worker";

async function main(){
 const mode=process.argv.slice(2).join(" ");
 if(!["--once","--watch"].includes(mode))throw Error("Usage: pnpm exec tsx scripts/process-company-recalculations.ts --once|--watch");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,
  statement_timeout:60000,application_name:"smn-company-recalc"});
 try{
  await db.connect();
  const v=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  if(v.rows[0]?.schema_version!==31)throw Error("Schema v31 initialized required");
  await ensureCapacityRecalcOutbox(db);
  if(mode==="--once")console.log(await processCompanyRecalculation(db));
  else{
   console.log("Company recalculation worker started; Ctrl+C to stop.");
   for(;;){
    try{await processCompanyRecalculation(db);}
    catch(error){console.error("company-recalc-loop-error",error instanceof Error?error.message:"unknown");}
    await new Promise(resolve=>setTimeout(resolve,30000));
   }
  }
 }finally{await db.end().catch(()=>undefined);}
}
main().catch(e=>{console.error(e instanceof Error?e.message:"Error");process.exitCode=1;});
