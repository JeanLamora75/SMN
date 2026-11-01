/** SMN-338 v33 : opération explicite, jamais lancée automatiquement. */
import {Client} from "pg";
import {randomUUID,createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {installedDatabaseUri} from "../src/server/auth/database";
export const SMN338_V33_NAME="20261101_smn338_indicator_v33";
export const SMN338_V33_FILE=new URL("../_bmad-output/planning-artifacts/SMN-338-DDL-ADDITIF-DRAFT.sql",import.meta.url);
export const INDICATOR_TABLES=["definition","team_selection","display_preference","manual_value","computed_result","dependency","cycle_revision","system_revision"].map(x=>"smn_indicator_"+x);
export async function applyV33(db:Client,apply:boolean){
 await db.query(apply?"BEGIN":"BEGIN TRANSACTION READ ONLY");
 try{
  if(apply)await db.query("SELECT pg_advisory_xact_lock(20261101,338)");
  const rows=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'"+(apply?" FOR UPDATE":""));
  if(rows.rows.length!==1||rows.rows[0].schema_version!==32||rows.rows[0].state!=="initialized")throw Error("Installation v32 initialisée requise");
  const hist=await db.query<{n:string;done:string}>("SELECT count(*)::text n,count(*) FILTER(WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::text done FROM public._prisma_migrations");
  const n=Number(hist.rows[0]?.n);
  if(![1,32].includes(n)||Number(hist.rows[0]?.done)!==n)throw Error("Journal v32 incompatible");
  const required=["smn_team","smn_account","smn_sprint","smn_kanban_period"];
  const found=await db.query<{relname:string}>("SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname=ANY($1::text[])",[...required,...INDICATOR_TABLES]);
  const names=new Set(found.rows.map(r=>r.relname));
  if(required.some(r=>!names.has(r))||INDICATOR_TABLES.some(r=>names.has(r)))throw Error("Relations préalables manquantes ou v33 partiellement présente");
  const sql=readFileSync(SMN338_V33_FILE,"utf8");
  const checksum=createHash("sha256").update(sql).digest("hex");
  if(apply){
   await db.query(sql);
   const verified=await db.query<{name:string}>("SELECT relname name FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname=ANY($1::text[])",[INDICATOR_TABLES]);
   if(verified.rows.length!==8)throw Error("Validation des 8 tables v33 échouée");
   const triggers=await db.query<{n:string}>("SELECT count(*)::text n FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE NOT t.tgisinternal AND c.relname LIKE 'smn_indicator_%'");
   if(Number(triggers.rows[0]?.n)!==3)throw Error("Validation des 3 triggers v33 échouée");
   await db.query("INSERT INTO public._prisma_migrations(id,checksum,finished_at,migration_name,applied_steps_count) VALUES($1,$2,now(),$3,1)",[randomUUID(),checksum,SMN338_V33_NAME]);
   await db.query("UPDATE public.smn_installation SET schema_version=33 WHERE id='singleton'");
   await db.query("COMMIT");
  }else await db.query("ROLLBACK");
  return {ready:true,applied:apply,history:n,checksum,version:apply?33:32};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e}
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||!["--check","--apply"].includes(args[0]))throw Error("Usage: pnpm exec tsx scripts/apply-smn-338-v33.ts --check|--apply");
 if(args[0]==="--apply"&&process.env.SMN_V33_BACKUP_VERIFIED!=="YES")
  throw Error("Migration refusée : sauvegarde vérifiée et SMN_V33_BACKUP_VERIFIED=YES requises");
 const uri=await installedDatabaseUri();const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();try{console.log(JSON.stringify(await applyV33(db,args[0]==="--apply"),null,2))}
 finally{await db.end()}
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/apply-smn-338-v33.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
