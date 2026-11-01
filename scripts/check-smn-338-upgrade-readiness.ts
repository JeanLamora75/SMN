/** SMN-338 : précontrôle strictement en lecture seule. Ne migre jamais une installation. */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")
  throw Error("Usage : pnpm exec tsx scripts/check-smn-338-upgrade-readiness.ts --check");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:12000});
 await db.connect();
 try{
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try{
   const state=await db.query<{state:string;schema_version:number}>(`SELECT state,schema_version
     FROM public.smn_installation WHERE id='singleton'`);
   const history=await db.query<{total:string;completed:string}>(`SELECT count(*)::text total,
     count(*) FILTER(WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::text completed
     FROM public._prisma_migrations`);
   const required=["smn_team","smn_account","smn_sprint","smn_kanban_period"];
   const existing=await db.query<{relname:string}>(`SELECT relname FROM pg_catalog.pg_class
    WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND relname=ANY($1::text[])`,[required]);
   const indicator=await db.query<{relname:string}>(`SELECT relname FROM pg_catalog.pg_class
    WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND relname LIKE 'smn_indicator_%'`);
   const missing=required.filter(n=>!existing.rows.some(r=>r.relname===n));
   const version=state.rows[0]?.schema_version, status=state.rows[0]?.state;
   const total=Number(history.rows[0]?.total),completed=Number(history.rows[0]?.completed);
   const versionReady=version===32&&status==="initialized";
   const historyReady=(total===32&&completed===32)||(total===1&&completed===1);
   const result={ready:versionReady&&historyReady&&missing.length===0&&indicator.rows.length===0,
    schemaVersion:version??null,installationStatus:status??null,
    migrations:{total,completed},missingRelations:missing,
    existingIndicatorRelations:indicator.rows.map(r=>r.relname).sort(),
    action:"AUCUNE : contrôle en lecture seule ; aucune migration activée"};
   console.log(JSON.stringify(result,null,2));
   if(!result.ready)process.exitCode=1;
  }finally{await db.query("ROLLBACK").catch(()=>undefined);}
 }finally{await db.end().catch(()=>undefined);}
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
