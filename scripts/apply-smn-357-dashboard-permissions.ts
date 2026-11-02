import {Client} from "pg";
import {readFileSync} from "node:fs";
import {installedDatabaseUri} from "../src/server/auth/database";
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||!["--check","--apply"].includes(args[0]))throw Error("Usage: --check | --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500});
 await db.connect();
 try{
  const state=await db.query<{state:string;schema_version:number}>("SELECT state,schema_version FROM public.smn_installation");
  if(state.rows.length!==1||state.rows[0].state!=="initialized"||state.rows[0].schema_version!==33)
   throw Error("SMN-357 requires initialized v33");
  const exists=await db.query<{exists:boolean}>("SELECT to_regclass('public.smn_dashboard_team_grant') IS NOT NULL AS exists");
  if(args[0]==="--check"){console.log(JSON.stringify({migration:"SMN-357",installed:exists.rows[0]?.exists}));return;}
  if(process.env.SMN_V33_BACKUP_VERIFIED!=="YES")throw Error("Verified backup required");
  const sql=readFileSync(new URL("../prisma/migrations/20261102_smn357_dashboard_permissions/migration.sql",import.meta.url),"utf8");
  await db.query("BEGIN");
  try{await db.query(sql);await db.query("COMMIT");}catch(e){await db.query("ROLLBACK");throw e;}
  console.log("SMN-357 grants schema installed");
 }finally{await db.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
