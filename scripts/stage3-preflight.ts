import {existsSync} from "node:fs";
import {Client} from "pg";
import {parseConnectionSettings} from "../src/server/db/config";
import {loadExistingUri} from "../src/server/bootstrap/settings";
import {existingManagedUri} from "../src/server/bootstrap/portable";

async function main(){
 for(const file of [".env.local",".env"]){
  if(!process.env.SMN_DATABASE_URL&&existsSync(file))process.loadEnvFile(file);
 }
 const parsed=parseConnectionSettings(process.env.SMN_DATABASE_URL);
 if(!parsed.ok&&parsed.status!=="configuration-missing")throw Error("database-configuration-invalid");
 const uri=parsed.ok?parsed.uri:(await loadExistingUri()??await existingManagedUri());
 if(!uri)throw Error("database-unavailable");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:5000,application_name:"smn-stage3-preflight"});
 await db.connect();
 try{
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const version=await db.query<{schema_version:number;state:string}>(
   "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'");
  if(version.rows[0]?.schema_version!==30||version.rows[0]?.state!=="initialized")
   throw Error("schema-v30-not-initialized");
  const counts=await db.query<{active:string;archived:string}>(
   "SELECT count(*) FILTER (WHERE NOT COALESCE((to_jsonb(t)->>'is_archived')::boolean,false))::text AS active, "+
   "count(*) FILTER (WHERE COALESCE((to_jsonb(t)->>'is_archived')::boolean,false))::text AS archived "+
   "FROM public.smn_team t WHERE installation_id='singleton'");
  const migrations=await db.query<{pending:string}>(
   "SELECT count(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL)::text AS pending FROM public._prisma_migrations");
  const checks=await db.query<{account:number;preference:number;team:number;registry:number;sprint:number;kanban:number}>(
   "SELECT (to_regclass('public.smn_account') IS NOT NULL)::int AS account,"+
   "(to_regclass('public.smn_account_team_preference') IS NOT NULL)::int AS preference,"+
   "(to_regclass('public.smn_team') IS NOT NULL)::int AS team,"+
   "(to_regclass('public.smn_registry_item') IS NOT NULL)::int AS registry,"+
   "(to_regclass('public.smn_sprint') IS NOT NULL)::int AS sprint,"+
   "(to_regclass('public.smn_kanban_period') IS NOT NULL)::int AS kanban");
  console.log("Schéma : v30 / initialized");
  console.log("Équipes actives :",counts.rows[0]?.active??"?", "- archivées :",counts.rows[0]?.archived??"?");
  console.log("Migrations non terminées :",migrations.rows[0]?.pending??"?");
  const modes=await db.query<{mode:string}>(
   "SELECT DISTINCT lower(agile_mode) AS mode FROM public.smn_team "+
   "WHERE installation_id='singleton' AND "+
   "COALESCE((to_jsonb(smn_team)->>'is_archived')::boolean,false)=false");
  const hasKanban=modes.rows.some(row=>row.mode==="kanban");
  const hasScrum=modes.rows.some(row=>row.mode==="scrum");
  const required=["account","preference","team","registry",
   ...(hasScrum?["sprint"]:[]),...(hasKanban?["kanban"]:[])];
  const missing=required.filter(name=>Number(checks.rows[0]?.[name as keyof typeof checks.rows[number]])!==1);
  if(!hasKanban&&Number(checks.rows[0]?.kanban)!==1)
   console.log("INFO : table Kanban absente ; aucune équipe Kanban active, contrôle différé");
  if(missing.length)throw Error("required-tables-missing:"+missing.join(","));
  if(Number(migrations.rows[0]?.pending)!==0)throw Error("migrations-incomplete");
  console.log("PASS : prérequis de structure vérifiés en lecture seule");
  const activation=process.env.SMN_MULTI_TEAM_CONTEXT_READY==="true"&&
   process.env.SMN_MULTI_TEAM_PILOT_ACK==="I_ACCEPT_UNVERIFIED_ISOLATION";
  console.log("Activation expérimentale demandée :",activation?"OUI":"NON");
  console.log("Écritures expérimentales demandées :",
   process.env.SMN_MULTI_TEAM_WRITES_ENABLED==="true"?"OUI":"NON");
  if(Number(counts.rows[0]?.active)===1)
   console.log("INFO : une seule équipe active ; l'essai interéquipes nécessitera une seconde équipe après activation");
  await db.query("ROLLBACK");
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 finally{await db.end().catch(()=>undefined);}
}
main().catch(error=>{
 console.error("ÉCHEC du précontrôle :",error instanceof Error?error.message:String(error));
 process.exitCode=1;
});
