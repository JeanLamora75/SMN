import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

const targets=[
 "smn_sprint_story_points","smn_sprint_story_points_audit",
 "smn_sprint_ticket_counts","smn_sprint_ticket_counts_audit",
 "smn_sprint_scores","smn_sprint_scores_audit",
 "smn_sprint_capacity_kpi","smn_sprint_closure_snapshot",
 "smn_kanban_flow_counts","smn_kanban_timing","smn_company_capacity_recalc"
] as const;

async function main(){
 if(process.argv.length!==2)throw Error("Usage : pnpm exec tsx scripts/audit-smn-337-dependencies.ts");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,
  statement_timeout:15000,application_name:"smn-337-catalog-audit-readonly"});
 await db.connect();
 let inTransaction=false;
 try{
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  inTransaction=true;
  const identity=await db.query<{database:string;version:string;read_only:string}>(`
   SELECT current_database() AS database,current_setting('server_version') AS version,
          current_setting('transaction_read_only') AS read_only`);
  if(identity.rows[0]?.read_only!=="on")throw Error("Transaction non en lecture seule");
  const state=await db.query<{schema_version:number;state:string}>(`
   SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'`);
  if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")
   throw Error("Audit réservé à une installation SMN v32 initialized");
  const present=await db.query<{name:string;kind:string}>(`
   SELECT c.relname AS name,c.relkind::text AS kind
   FROM pg_catalog.pg_class c
   JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname=ANY($1::text[]) ORDER BY c.relname`,[targets]);
  const constraints=await db.query<{table:string;name:string;kind:string;definition:string}>(`
   SELECT con.conrelid::regclass::text AS "table",con.conname AS name,con.contype::text AS kind,
          pg_catalog.pg_get_constraintdef(con.oid) AS definition
   FROM pg_catalog.pg_constraint con
   WHERE con.conrelid IN (SELECT oid FROM pg_catalog.pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[]))
      OR con.confrelid IN (SELECT oid FROM pg_catalog.pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[]))
   ORDER BY 1,2`,[targets]);
  const triggers=await db.query<{table:string;name:string;definition:string}>(`
   SELECT t.tgrelid::regclass::text AS "table",t.tgname AS name,
          pg_catalog.pg_get_triggerdef(t.oid) AS definition
   FROM pg_catalog.pg_trigger t
   WHERE NOT t.tgisinternal AND t.tgrelid IN
      (SELECT oid FROM pg_catalog.pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[]))
   ORDER BY 1,2`,[targets]);
  const dependencies=await db.query<{dependent:string;referenced:string;type:string}>(`
   SELECT pg_catalog.pg_describe_object(d.classid,d.objid,d.objsubid) AS dependent,
          pg_catalog.pg_describe_object(d.refclassid,d.refobjid,d.refobjsubid) AS referenced,
          d.deptype::text AS type
   FROM pg_catalog.pg_depend d
   WHERE d.refclassid='pg_catalog.pg_class'::regclass
     AND d.refobjid IN
       (SELECT oid FROM pg_catalog.pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[]))
     AND d.deptype IN ('n','a','i','e')
   ORDER BY 2,1`,[targets]);
  const viewRefs=await db.query<{schema:string;name:string;definition:string}>(`
   SELECT schemaname AS schema,viewname AS name,definition
   FROM pg_catalog.pg_views
   WHERE schemaname='public' AND
      EXISTS (SELECT 1 FROM unnest($1::text[]) t(name) WHERE definition ILIKE '%'||t.name||'%')
   ORDER BY 1,2`,[targets]);
  const functions=await db.query<{schema:string;name:string;identity_args:string;definition:string}>(`
   SELECT n.nspname AS schema,p.proname AS name,
          pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_args,
          pg_catalog.pg_get_functiondef(p.oid) AS definition
   FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND EXISTS
      (SELECT 1 FROM unnest($1::text[]) t(name)
       WHERE pg_catalog.pg_get_functiondef(p.oid) ILIKE '%'||t.name||'%')
   ORDER BY 1,2,3`,[targets]);
  const report={status:"audited-read-only",schemaVersion:32,
   connection:{database:identity.rows[0]?.database,postgresVersion:identity.rows[0]?.version,readOnly:true},
   targets:targets.map(name=>({name,present:present.rows.some(row=>row.name===name)})),
   constraints:constraints.rows,triggers:triggers.rows,dependencies:dependencies.rows,
   referencingViews:viewRefs.rows,referencingFunctions:functions.rows,
   caveat:"Les requêtes SQL construites dans TypeScript ne figurent pas nécessairement dans pg_depend ; recouper avec l'inventaire PowerShell. Aucun DROP autorisé."};
  await db.query("ROLLBACK");inTransaction=false;
  console.log(JSON.stringify(report,null,2));
 }catch(error){
  if(inTransaction)await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }finally{await db.end().catch(()=>undefined);}
}
main().catch(error=>{console.error("Audit SMN-337 impossible :",error instanceof Error?error.message:String(error));process.exitCode=1;});
