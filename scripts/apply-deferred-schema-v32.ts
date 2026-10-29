/**
 * Explicit, additive migration of four legacy deferred tables for an initialized v32 installation.
 * Run BEFORE deploying services which no longer create those relations implicitly.
 * Command: pnpm exec tsx scripts/apply-deferred-schema-v32.ts --apply
 * No schema_version change: this materializes tables already authorized as optional by v32.
 */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

const definitions: Array<{name:string;sql:string;required:string[]}>= [
 {name:"smn_automatic_highlight_settings",required:["installation_id","category","enabled","revision","updated_by","updated_at"],sql:`CREATE TABLE IF NOT EXISTS public.smn_automatic_highlight_settings(
 installation_id text NOT NULL REFERENCES public.smn_installation(id),
 category text NOT NULL CHECK(category IN ('criticalRisk','atRiskDependency','resolvedObstacle','achievedGoal','recordedDecision','satisfiedDependency')),
 enabled boolean NOT NULL,revision integer NOT NULL CHECK(revision>0),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(installation_id,category))`},
 {name:"smn_report_template",required:["id","name","sections","content","created_by","created_at","history_depth","revision"],sql:`CREATE TABLE IF NOT EXISTS public.smn_report_template(
 id text PRIMARY KEY CHECK(id<>'standard'), name text NOT NULL,
 sections jsonb NOT NULL,content jsonb NOT NULL,
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 history_depth integer NOT NULL DEFAULT 5 CHECK(history_depth BETWEEN 1 AND 5),
 revision integer NOT NULL DEFAULT 1)`},
 {name:"smn_report_draft",required:["sprint_id","notes","revision","updated_at","updated_by"],sql:`CREATE TABLE IF NOT EXISTS public.smn_report_draft(
 sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 notes jsonb NOT NULL, revision integer NOT NULL CHECK(revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)`},
 {name:"smn_report_draft_audit",required:["id","sprint_id","revision","before_values","after_values","actor_id","changed_at"],sql:`CREATE TABLE IF NOT EXISTS public.smn_report_draft_audit(
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 revision integer NOT NULL,before_values jsonb,after_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now())`}
];
const expectedTypes:Record<string,Record<string,string>>={
 smn_automatic_highlight_settings:{installation_id:"text",category:"text",enabled:"boolean",revision:"integer",updated_by:"text",updated_at:"timestamp with time zone"},
 smn_report_template:{id:"text",name:"text",sections:"jsonb",content:"jsonb",created_by:"text",created_at:"timestamp with time zone",history_depth:"integer",revision:"integer"},
 smn_report_draft:{sprint_id:"text",notes:"jsonb",revision:"integer",updated_at:"timestamp with time zone",updated_by:"text"},
 smn_report_draft_audit:{id:"text",sprint_id:"text",revision:"integer",before_values:"jsonb",after_values:"jsonb",actor_id:"text",changed_at:"timestamp with time zone"}
};
const requiredNotNull:Record<string,string[]>={
 smn_automatic_highlight_settings:["installation_id","category","enabled","revision","updated_at"],
 smn_report_template:["id","name","sections","content","created_at","history_depth","revision"],
 smn_report_draft:["sprint_id","notes","revision","updated_at"],
 smn_report_draft_audit:["id","sprint_id","revision","after_values","changed_at"]
};
function validateTypes(table:string,columns:Array<{name:string;typ:string;nullable:string}>,partial=false){
 const mapping=expectedTypes[table];const notNull=requiredNotNull[table];
 for(const col of columns){
  if(mapping[col.name]!==undefined&&col.typ!==mapping[col.name])throw Error("Type incompatible "+table+"."+col.name+": "+col.typ);
  if(notNull.includes(col.name)&&col.nullable!=="NO")throw Error("Colonne nullable incompatible "+table+"."+col.name);
 }
 if(!partial&&Object.keys(mapping).some(name=>!columns.some(x=>x.name===name)))throw Error("Colonnes manquantes : "+table);
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-deferred-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,33)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")
    throw Error("Installation initialisée en v32 requise");
   for(const table of definitions){
    const prior=await db.query<{name:string;typ:string;nullable:string}>(`
      SELECT column_name AS name,data_type AS typ,is_nullable AS nullable
      FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,[table.name]);
    if(prior.rows.length){
     validateTypes(table.name,prior.rows,true);
     const known=new Map(prior.rows.map(x=>[x.name,x]));
     // The legacy templates table may lack the two additive columns.
     const missing=table.required.filter(x=>!known.has(x));
     if(table.name!=="smn_report_template"&&missing.length)throw Error("Structure existante incompatible : "+table.name+" ("+missing.join(",")+")");
     if(table.name==="smn_report_template"&&missing.some(x=>!["history_depth","revision"].includes(x)))throw Error("Modèle de rapports existant incompatible");
    }
    await db.query(table.sql);
    if(table.name==="smn_report_template"){
     await db.query("ALTER TABLE public.smn_report_template ADD COLUMN IF NOT EXISTS history_depth integer NOT NULL DEFAULT 5 CHECK(history_depth BETWEEN 1 AND 5)");
     await db.query("ALTER TABLE public.smn_report_template ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1");
    }
    const columns=await db.query<{name:string;typ:string;nullable:string}>(`SELECT column_name AS name,data_type AS typ,is_nullable AS nullable FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1`,[table.name]);
    validateTypes(table.name,columns.rows);
    const present=new Set(columns.rows.map(x=>x.name));
    if(table.required.some(x=>!present.has(x)))throw Error("Validation des colonnes échouée : "+table.name);
   }
   await db.query("COMMIT");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 }finally{await db.end();}
 console.log("Tables différées v32 matérialisées, aucune donnée supprimée. Exécuter pnpm db:diagnose");
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
