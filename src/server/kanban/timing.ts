import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {scopedKanbanPeriod,type KanbanTeamAccess} from "@/server/kanban/scoped-period";
import {ensureKanbanPeriodTables} from "./periods";
export type TimingValue={days:number|null;convention:"calendar"|"business"|"unknown";source:string};
export function parseTiming(raw:unknown):{cycle:TimingValue;lead:TimingValue}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="cycle,lead")return null;
 function field(x:unknown):TimingValue|null{
  if(!x||typeof x!=="object"||Array.isArray(x))return null;
  const o=x as Record<string,unknown>;
  if(Object.keys(o).sort().join(",")!=="convention,days,source"||
    !["calendar","business","unknown"].includes(String(o.convention))||
    typeof o.source!=="string"||o.source.length>500||
    (o.days!==null&&(typeof o.days!=="number"||!Number.isFinite(o.days)||o.days<0||o.days>100000)))return null;
  return {days:o.days as number|null,convention:o.convention as TimingValue["convention"],source:o.source.trim()};
 }
 const cycle=field(v.cycle),lead=field(v.lead);
 return cycle&&lead?{cycle,lead}:null;
}
export function comparableTiming(v:TimingValue){return v.days!==null&&v.convention==="calendar";}
export function formatTiming(value:number|null,locale:"fr"|"en"){return value===null?"—":new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{minimumFractionDigits:1,maximumFractionDigits:1}).format(value);}
export async function ensureKanbanTimingSchema(db:Client){
 await ensureKanbanPeriodTables(db);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_kanban_timing(
 period_id text PRIMARY KEY REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 cycle_days numeric(14,6),cycle_convention text NOT NULL DEFAULT 'unknown',cycle_source text NOT NULL DEFAULT '',
 lead_days numeric(14,6),lead_convention text NOT NULL DEFAULT 'unknown',lead_source text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_kanban_timing_audit(
 id text PRIMARY KEY,period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 before_values jsonb,after_values jsonb NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now())`);
}
export async function readKanbanTiming(db:Client,id:string,access?:KanbanTeamAccess){
 await ensureKanbanTimingSchema(db);
 const p=await scopedKanbanPeriod(db,id,false,access);
 if(!p)return null;
 const r=await db.query<{cycle_days:string|null;cycle_convention:TimingValue["convention"];cycle_source:string;lead_days:string|null;lead_convention:TimingValue["convention"];lead_source:string}>(`SELECT cycle_days::text,cycle_convention,cycle_source,lead_days::text,lead_convention,lead_source FROM public.smn_kanban_timing WHERE period_id=$1`,[id]);
 const x=r.rows[0];
 const cycle:TimingValue={days:x?.cycle_days==null?null:Number(x.cycle_days),convention:x?.cycle_convention??"unknown",source:x?.cycle_source??""};
 const lead:TimingValue={days:x?.lead_days==null?null:Number(x.lead_days),convention:x?.lead_convention??"unknown",source:x?.lead_source??""};
 return {cycle,lead,comparable:{cycle:comparableTiming(cycle),lead:comparableTiming(lead)},status:p.status};
}
export async function saveKanbanTiming(db:Client,actorId:string,id:string,raw:unknown,access?:KanbanTeamAccess){
 const values=parseTiming(raw);
 if(!values)return {ok:false as const,error:"invalid-input" as const};
 await ensureKanbanTimingSchema(db);
 await db.query("BEGIN");
 try{
  const p=await scopedKanbanPeriod(db,id,true,access,actorId);
  if(!p){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(p.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  const before=await db.query(`SELECT * FROM public.smn_kanban_timing WHERE period_id=$1 FOR UPDATE`,[id]);
  await db.query(`INSERT INTO public.smn_kanban_timing(period_id,cycle_days,cycle_convention,cycle_source,lead_days,lead_convention,lead_source,updated_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8)
   ON CONFLICT(period_id) DO UPDATE SET cycle_days=EXCLUDED.cycle_days,cycle_convention=EXCLUDED.cycle_convention,
   cycle_source=EXCLUDED.cycle_source,lead_days=EXCLUDED.lead_days,lead_convention=EXCLUDED.lead_convention,
   lead_source=EXCLUDED.lead_source,updated_by=EXCLUDED.updated_by,updated_at=now()`,
   [id,values.cycle.days,values.cycle.convention,values.cycle.source,values.lead.days,values.lead.convention,values.lead.source,actorId]);
  await db.query(`INSERT INTO public.smn_kanban_timing_audit(id,period_id,before_values,after_values,actor_id)
   VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[randomUUID(),id,before.rows[0]?JSON.stringify(before.rows[0]):null,JSON.stringify(values),actorId]);
  await db.query("COMMIT");
  return {ok:true as const,values};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
