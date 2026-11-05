/** Migration additive explicite SMN-229 : exiger une sauvegarde v33 vérifiée. */
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
  if(state.rows.length!==1||state.rows[0].state!=="initialized"||state.rows[0].schema_version!==33)throw Error("SMN-229 requires initialized v33");
  const present=await db.query<{name:string}>(`SELECT column_name AS name FROM information_schema.columns
   WHERE table_schema='public' AND table_name='smn_scrum_ceremony_template' AND column_name IN ('icon_name','icon_color')`);
  const installed=present.rows.length===2;
  if(args[0]==="--check"){console.log(JSON.stringify({migration:"SMN-229-appearance",installed}));return;}
  if(process.env.SMN_V33_BACKUP_VERIFIED!=="YES")throw Error("Verified v33 backup required: SMN_V33_BACKUP_VERIFIED=YES");
  const sql=readFileSync(new URL("../prisma/migrations/20261105_smn229_ceremony_appearance/migration.sql",import.meta.url),"utf8");
  await db.query("BEGIN");
  try{await db.query(sql);await db.query("COMMIT");}catch(e){await db.query("ROLLBACK");throw e;}
  console.log("SMN-229 appearance migration applied");
 }finally{await db.end();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
