import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
/** Migration additive réservée au parcours historique des Sprints (schémas <=27). */
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-legacy-sprint-reschedule-audit.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,37)");
   const r=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(r.rows.length!==1||r.rows[0].state!=="initialized"||r.rows[0].schema_version>27||r.rows[0].schema_version<1)
    throw Error("Migration réservée aux installations historiques initialisées v1 à v27");
   await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_reschedule_audit(
    id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
    old_start timestamptz NOT NULL,old_end timestamptz NOT NULL,
    new_start timestamptz NOT NULL,new_end timestamptz NOT NULL,
    mode text NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    occurred_at timestamptz NOT NULL DEFAULT now())`);
   const rows=await db.query<{column_name:string;data_type:string;is_nullable:string}>(`SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_sprint_reschedule_audit'`);
   const required:Record<string,string>={id:"text",sprint_id:"text",old_start:"timestamp with time zone",old_end:"timestamp with time zone",new_start:"timestamp with time zone",new_end:"timestamp with time zone",mode:"text",actor_id:"text",occurred_at:"timestamp with time zone"};
   if(Object.entries(required).some(([name,type])=>!rows.rows.some(x=>x.column_name===name&&x.data_type===type&&(name==="actor_id"||x.is_nullable==="NO"))))
    throw Error("Structure de l'audit incompatible");
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Audit de replanification historique prêt, aucune donnée supprimée");
}
main().catch(e=>{console.error(e);process.exitCode=1});
