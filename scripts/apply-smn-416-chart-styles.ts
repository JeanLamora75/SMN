/** Explicit additive maintenance only: never migrates the database silently. */
import {Client} from "pg";
import {readFileSync} from "node:fs";
import {installedDatabaseUri} from "../src/server/auth/database";

async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||!["--check","--apply"].includes(args[0]))
  throw Error("Usage: pnpm exec tsx scripts/apply-smn-416-chart-styles.ts --check | --apply");
 const client=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await client.connect();
 try{
  const state=await client.query<{id:string;state:string;schema_version:number}>(
   "SELECT id,state,schema_version FROM public.smn_installation WHERE id='singleton'");
  if(state.rows.length!==1||state.rows[0].state!=="initialized"||state.rows[0].schema_version!==33)
   throw Error("SMN-416 requires initialized native v33 installation");
  const tables=await client.query<{styles:boolean;defaults:boolean}>(`SELECT
   to_regclass('public.smn_chart_style') IS NOT NULL AS styles,
   to_regclass('public.smn_chart_style_default') IS NOT NULL AS defaults`);
  if(args[0]==="--check"){
   console.log(JSON.stringify({migration:"SMN-416",installed:tables.rows[0].styles&&tables.rows[0].defaults,
    styles:tables.rows[0].styles,defaults:tables.rows[0].defaults}));
   return;
  }
  if(process.env.SMN_V33_BACKUP_VERIFIED!=="YES")throw Error("Verified backup required: SMN_V33_BACKUP_VERIFIED=YES");
  const sql=readFileSync(new URL("../prisma/migrations/20261108_smn416_chart_styles/migration.sql",import.meta.url),"utf8");
  await client.query("BEGIN");
  try{
   await client.query("SELECT pg_advisory_xact_lock(20261108,416)");
   await client.query(sql);
   await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK").catch(()=>undefined);throw error;}
  console.log(JSON.stringify({migration:"SMN-416",applied:true}));
 }finally{await client.end();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:"SMN-416 migration failed");process.exitCode=1;});
