import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {ensureCapacityRecalcOutbox} from "../src/server/capacity/company-recalc-outbox";
import {processCompanyRecalculation} from "../src/server/capacity/company-recalc-worker";

async function main(){
 if(process.argv.slice(2).join(" ")!=="--once")throw Error("Usage: pnpm exec tsx scripts/process-company-recalculations.ts --once");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,
  statement_timeout:60000,application_name:"smn-company-recalc"});
 try{
  await db.connect();
  const v=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  if(v.rows[0]?.schema_version!==31)throw Error("Schema v31 initialized required");
  await ensureCapacityRecalcOutbox(db);
  console.log(await processCompanyRecalculation(db));
 }finally{await db.end().catch(()=>undefined);}
}
main().catch(e=>{console.error(e instanceof Error?e.message:"Error");process.exitCode=1;});
