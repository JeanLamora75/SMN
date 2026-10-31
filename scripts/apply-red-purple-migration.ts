/** Controlled palette maintenance for installed SMN v32 databases. */
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

const sql=readFileSync(new URL("../prisma/migrations/20261031_red_purple_palette/migration.sql",import.meta.url),"utf8");
const name="smn_general_settings_palette_check";

export function paletteMigrationBody(source:string):string {
 const body=source.replace(/^\s*(?:--[^\n]*\n)*/,"").trim();
 if(!body.startsWith("BEGIN;")||!body.endsWith("COMMIT;"))throw Error("SQL transactionnel attendu");
 return body.slice("BEGIN;".length,-"COMMIT;".length).trim();
}
export async function runRedPurpleMigration(db:Client,apply:boolean):Promise<void>{
 await db.query("BEGIN");
 try{
  await db.query("SET LOCAL lock_timeout='5s'");
  await db.query("SET LOCAL statement_timeout='30s'");
  await db.query("SELECT pg_advisory_xact_lock(20261031,4)");
  const state=await db.query<{schema_version:number;state:string}>(
   "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  if(state.rows.length!==1||state.rows[0].state!=="initialized"||state.rows[0].schema_version!==32)
   throw Error("Installation initialisée v32 requise");
  const history=await db.query<{total:string;finished:string}>(`
   SELECT count(*)::text total,
    count(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::text finished
   FROM public._prisma_migrations`);
  const {total,finished}=history.rows[0]??{};
  if(total!==finished||!["1","32"].includes(total))
   throw Error("Historique v32 non conforme");
  const result=await db.query<{definition:string}>(`
   SELECT pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c
   WHERE c.conrelid='public.smn_general_settings'::regclass
   AND c.conname=$1 AND c.contype='c'`,[name]);
  const definition=result.rows[0]?.definition;
  if(!definition||!["ocean","forest","violet"].every(x=>definition.includes("'"+x+"'")))
   throw Error("Contrainte palette incompatible : migration refusée");
  if(definition.includes("red-purple")){
   console.log("Red & Purple est déjà autorisée.");
  }else if(apply){
   await db.query(paletteMigrationBody(sql));
   console.log("Contrainte Red & Purple appliquée dans la transaction.");
  }else console.log("Migration nécessaire : contrainte limitée aux trois palettes historiques.");
  if(apply){
   const check=await db.query<{definition:string}>(`SELECT pg_get_constraintdef(oid) definition
    FROM pg_constraint WHERE conrelid='public.smn_general_settings'::regclass AND conname=$1`,[name]);
   if(!check.rows[0]?.definition.includes("red-purple"))throw Error("Vérification post-migration échouée");
   await db.query("COMMIT");
  }else await db.query("ROLLBACK");
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
async function main(){
 const arg=process.argv.slice(2);
 if(arg.length!==1||!["--check","--apply"].includes(arg[0]))
  throw Error("Usage: pnpm db:migrate:red-purple --check|--apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,
  statement_timeout:30000,application_name:"smn-red-purple-maintenance"});
 try{await db.connect();await runRedPurpleMigration(db,arg[0]==="--apply");}
 finally{await db.end().catch(()=>undefined);}
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/apply-red-purple-migration.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:"Migration refusée");process.exitCode=1;});
