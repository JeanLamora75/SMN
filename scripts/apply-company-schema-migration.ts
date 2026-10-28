/** Manually initiated guarded SMN v30 -> v31 migration. */
import {createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

const NAME="20261028_smn316_company_catalog";
export async function applyCompanySchemaMigration(db:Client,sql:string){
 await db.query("BEGIN");
 try {
  await db.query("SELECT pg_advisory_xact_lock(20261020,16)");
  const installation=await db.query<{schema_version:number;state:string}>(
   "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  if(installation.rows.length!==1||installation.rows[0].schema_version!==30||
   installation.rows[0].state!=="initialized")throw Error("Base initialisée v30 requise");
  const history=await db.query<{total:string;finished:string}>(`SELECT count(*)::text AS total,
   count(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::text AS finished
   FROM public._prisma_migrations`);
  if(history.rows[0]?.total!=="30"||history.rows[0]?.finished!=="30")
   throw Error("Journal des 30 migrations non conforme");
  for(const table of ["smn_company_closure","smn_company_closure_history"]){
   const count=await db.query<{n:string}>(`SELECT count(*)::text AS n FROM public.${table}`);
   if(count.rows[0]?.n!=="0")throw Error("Migration refusée : données présentes dans "+table);
  }
  const exists=await db.query<{present:boolean}>(
   "SELECT to_regclass('public.smn_company') IS NOT NULL AS present");
  if(exists.rows[0]?.present)throw Error("Catalogue entreprise déjà présent");
  await db.query(sql);
  const version=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
  if(version.rows[0]?.schema_version!==31)throw Error("Migration v31 non confirmée");
  await db.query(`INSERT INTO public._prisma_migrations
   (id,checksum,finished_at,migration_name,applied_steps_count)
   VALUES($1,$2,now(),$3,1)`,[
    randomUUID(),createHash("sha256").update(sql).digest("hex"),NAME
   ]);
  await db.query("COMMIT");
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")
  throw Error("Usage: pnpm exec tsx scripts/apply-company-schema-migration.ts --apply");
 const sql=readFileSync(new URL("../prisma/migrations/"+NAME+"/migration.sql",import.meta.url),"utf8");
 const uri=await installedDatabaseUri();
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:30000,application_name:"smn-v31-company-migration"});
 try{await db.connect();await applyCompanySchemaMigration(db,sql);}
 finally{await db.end().catch(()=>undefined);}
 console.log("Migration SMN v31 appliquée. Lancer pnpm db:diagnose.");
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/apply-company-schema-migration.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:"Erreur migration");process.exitCode=1;});
