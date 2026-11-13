import type {Client} from "pg";
import {evaluateSchemaCapability} from "@/server/schema/compatibility";

/** Explicit admin-only additive repair for the legacy SMN-91 table omitted from
 * the native v32 baseline. Never called during ordinary GET or page rendering.
 * Existing tables, Sprint records and user work hours are never rewritten.
 */
export async function repairMissingWorkSlotsTable(db:Client):Promise<
 {ok:true;created:boolean}|{ok:false;error:"installation-not-ready"|"table-incompatible"|"prerequisite-missing"}
>{
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261022,91)");
  const installation=await db.query<{schema_version:number;state:string}>(
   "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  const state=installation.rows[0];
  if(!state||state.state!=="initialized"||!evaluateSchemaCapability(state.schema_version,"multi-team").ok){
   await db.query("ROLLBACK");return {ok:false,error:"installation-not-ready"};
  }
  const objects=await db.query<{team:boolean;account:boolean;slots:boolean}>(`
   SELECT to_regclass('public.smn_team') IS NOT NULL AS team,
    to_regclass('public.smn_account') IS NOT NULL AS account,
    to_regclass('public.smn_team_work_slots') IS NOT NULL AS slots`);
  const check=objects.rows[0];
  if(!check?.team||!check?.account){
   await db.query("ROLLBACK");return {ok:false,error:"prerequisite-missing"};
  }
  if(check.slots){
   // Do not silently accept or overwrite an existing unverified structure.
   const columns=await db.query<{column_name:string;data_type:string;is_nullable:string}>(`
    SELECT column_name,data_type,is_nullable FROM information_schema.columns
    WHERE table_schema='public' AND table_name='smn_team_work_slots'`);
   const expected:Record<string,[string,boolean]>={
    team_id:["text",false],time_zone:["text",false],
    morning_start:["time without time zone",false],
    morning_end:["time without time zone",false],
    afternoon_start:["time without time zone",false],
    afternoon_end:["time without time zone",false],
    configured_by:["text",true],configured_at:["timestamp with time zone",false],
    revision:["integer",false]
   };
   if(Object.keys(expected).some(name=>{
    const c=columns.rows.find(row=>row.column_name===name);
    return !c||c.data_type!==expected[name][0]||(c.is_nullable==="YES")!==expected[name][1];
   })){
    await db.query("ROLLBACK");return {ok:false,error:"table-incompatible"};
   }
   await db.query("COMMIT");return {ok:true,created:false};
  }
  // Exact schema from prisma/migrations/20261022_smn91_work_slots/migration.sql.
  await db.query(`CREATE TABLE public.smn_team_work_slots(
    team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,
    time_zone text NOT NULL,
    morning_start time NOT NULL,
    morning_end time NOT NULL,
    afternoon_start time NOT NULL,
    afternoon_end time NOT NULL,
    configured_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    configured_at timestamptz NOT NULL DEFAULT now(),
    revision integer NOT NULL DEFAULT 1,
    CHECK (morning_start < morning_end AND morning_end <= afternoon_start AND afternoon_start < afternoon_end)
  )`);
  await db.query("COMMIT");
  return {ok:true,created:true};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
