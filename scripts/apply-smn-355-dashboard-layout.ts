/** Explicit additive maintenance migration. Run only after verified backup. */
import { Client } from "pg";
import { readFileSync } from "node:fs";
import { installedDatabaseUri } from "../src/server/auth/database";
async function main() {
  const arg=process.argv.slice(2);
  if (arg.length!==1 || !["--check","--apply"].includes(arg[0])) throw new Error("Usage: --check | --apply");
  const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500});
  await db.connect();
  try {
    const state=await db.query<{state:string;schema_version:number}>("SELECT state,schema_version FROM public.smn_installation");
    if(state.rows.length!==1||state.rows[0].state!=="initialized"||state.rows[0].schema_version!==33)
      throw new Error("SMN-355 requires initialized v33 database");
    const present=await db.query<{exists:boolean}>("SELECT to_regclass('public.smn_dashboard_layout') IS NOT NULL AS exists");
    if(arg[0]==="--check"){console.log(JSON.stringify({migration:"SMN-355",installed:present.rows[0].exists}));return;}
    if(process.env.SMN_V33_BACKUP_VERIFIED!=="YES")throw new Error("Verified backup required");
    const sql=readFileSync(new URL("../prisma/migrations/20261102_smn355_dashboard_layout/migration.sql",import.meta.url),"utf8");
    await db.query("BEGIN");
    try {await db.query(sql);await db.query("COMMIT");}catch(e){await db.query("ROLLBACK");throw e;}
    console.log("SMN-355 migration applied");
  } finally {await db.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
