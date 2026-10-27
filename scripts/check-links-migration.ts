/**
 * Précontrôle non destructif de la migration Liens.
 * N'exécute aucun DDL, n'enregistre aucune migration, ne modifie pas la base.
 */
import {existsSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

async function main(){
 for(const file of [".env.local",".env"]){
  if(!process.env.SMN_DATABASE_URL&&existsSync(file))process.loadEnvFile(file);
 }
 const db=new Client({connectionString:await installedDatabaseUri(),
  connectionTimeoutMillis:3500,statement_timeout:5000,
  application_name:"smn-links-preflight-readonly"});
 await db.connect();
 try{
  await db.query("BEGIN TRANSACTION READ ONLY");
  const current=await db.query<{schema_version:number;state:string}>(`
   SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'`);
  const history=await db.query<{completed:string}>(`
   SELECT count(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::text AS completed
   FROM public._prisma_migrations`);
  const tables=await db.query<{name:string}>(`
   SELECT relname AS name FROM pg_catalog.pg_class
   WHERE relnamespace='public'::regnamespace AND relkind='r'
   AND relname IN ('smn_link_category','smn_link','smn_link_audit')`);
  const row=current.rows[0],names=tables.rows.map(r=>r.name);
  const safe=row?.schema_version===28&&row.state==="initialized"&&
   history.rows[0]?.completed==="28"&&names.length===0;
  process.stdout.write(JSON.stringify({
   safeBaseline:safe,version:row?.schema_version??null,
   state:row?.state??null,completedMigrations:history.rows[0]?.completed??null,
   alreadyPresentTables:names,
   migrationAllowed:false,
   reason:"Apply only with the controlled transactional migration runner after backup and compatibility checks."
  },null,2)+"\n");
  await db.query("ROLLBACK");
  if(!safe)process.exitCode=1;
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 finally{await db.end();}
}
main().catch(e=>{console.error("Liens preflight failed",e instanceof Error?e.message:"unknown");process.exitCode=1;});
