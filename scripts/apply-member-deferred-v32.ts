import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
/** Transactional additive materialization of optional member audit infrastructure. */
export const memberDDL=[`CREATE TABLE IF NOT EXISTS public.smn_member_assignment_start_audit(
 id uuid PRIMARY KEY,member_id uuid NOT NULL,assignment_id uuid NOT NULL,
 old_start_on date NOT NULL,new_start_on date NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),changed_by text NOT NULL)`] as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-member-deferred-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,36)");
   const v=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(v.rows[0]?.schema_version!==32||v.rows[0].state!=="initialized")throw Error("Base initialisée v32 requise");
   const current=await db.query<{column_name:string;data_type:string;is_nullable:string}>(`SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_member_assignment_start_audit'`);
   const expected:Record<string,string>={id:"uuid",member_id:"uuid",assignment_id:"uuid",old_start_on:"date",new_start_on:"date",changed_at:"timestamp with time zone",changed_by:"text"};
   if(current.rows.length){
    if(current.rows.length!==Object.keys(expected).length||current.rows.some(c=>expected[c.column_name]!==c.data_type||c.is_nullable!=="NO"))
     throw Error("Structure historique de l'audit incompatible");
   }
   for(const sql of memberDDL)await db.query(sql);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Audit des corrections d'affectation matérialisé sans suppression");
}
if(process.argv[1]?.includes("apply-member-deferred-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
