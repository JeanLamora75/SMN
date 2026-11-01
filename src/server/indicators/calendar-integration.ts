import type {Client} from "pg";
import {readDevelopmentCapacity} from "../capacity/engine";
import {recalculateIndicatorResultsWithinTransaction,type CycleScope} from "./recalculation";
import {type CalendarSourceTag} from "./dependencies";

export const CALENDAR_CHANGE_TAGS=["CAL_WORKING_DAYS","CAL_WORKING_HOURS","CAL_PUBLIC_HOLIDAYS",
 "CAL_ABSENCE_DAYS","CAL_CLOSURE_DAYS","CAL_CAPACITY_JH"] as const satisfies readonly CalendarSourceTag[];
export type CalendarImpact=Readonly<{teamIds?:readonly string[];companyId?:string;startOn:string;endOn:string;
 previousStartOn?:string;previousEndOn?:string}>;
const validDate=(x:string)=>/^\d{4}-\d{2}-\d{2}$/.test(x);
export async function lockIndicatorRevisionBeforeCalendarWrite(db:Client):Promise<boolean>{
 const state=await db.query<{schema_version:number}>(
  "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
 if(state.rows[0]?.schema_version!==33)return false;
 const row=await db.query("SELECT revision FROM public.smn_indicator_system_revision WHERE singleton_key='singleton' FOR UPDATE");
 if(row.rows.length!==1)throw Error("indicator-revision-missing");
 return true;
}
/** Invoked after the calendar write but before its single COMMIT, on the same client. */
export async function recalculateCalendarImpactWithinTransaction(db:Client,impact:CalendarImpact):Promise<{cycles:number;results:number}>{
 const dates=[impact.startOn,impact.endOn,impact.previousStartOn,impact.previousEndOn].filter((x):x is string=>x!==undefined);
 if(!dates.length||!dates.every(validDate)||!impact.companyId&&!impact.teamIds?.length)
  throw Error("calendar-impact-invalid-scope");
 const start=dates.reduce((a,b)=>a<b?a:b),end=dates.reduce((a,b)=>a>b?a:b);
 const teams=impact.teamIds?.length?[...new Set(impact.teamIds)].sort():(
  await db.query<{team_id:string}>(`SELECT DISTINCT a.team_id FROM public.smn_member_assignment a
   JOIN public.smn_member m ON m.id=a.member_id
   WHERE m.company_id=$1 AND a.start_on<=$3::date AND
    (a.end_on IS NULL OR a.end_on>=$2::date) ORDER BY a.team_id`,[impact.companyId,start,end])
 ).rows.map(x=>x.team_id);
 let cycles=0,results=0;
 for(const teamId of teams){
  const rows=await db.query<{cycle_type:"scrum"|"kanban";cycle_id:string;start_on:string;end_on:string}>(`
   SELECT 'scrum'::text AS cycle_type,s.id AS cycle_id,s.start_at::date::text AS start_on,s.end_at::date::text AS end_on
   FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
   WHERE s.team_id=$1 AND t.agile_mode='scrum' AND NOT t.is_archived AND s.deleted_at IS NULL
    AND s.start_at::date<=$3::date AND s.end_at::date>=$2::date
   UNION ALL
   SELECT 'kanban',p.id,p.start_on::text,p.end_on::text
   FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
   WHERE p.team_id=$1 AND t.agile_mode='kanban' AND NOT t.is_archived AND p.deleted_at IS NULL
    AND p.start_on<=$3::date AND p.end_on>=$2::date
   ORDER BY cycle_type,cycle_id LIMIT 1001`,[teamId,start,end]);
  if(rows.rows.length>1000)throw Error("calendar-impact-cycle-budget");
  if(!rows.rows.length)continue;
  const scopes:CycleScope[]=rows.rows.map(x=>({teamId,cycleType:x.cycle_type,cycleId:x.cycle_id}));
  const sources:Record<string,{CAL_CAPACITY_JH:string|null}>={};
  for(const row of rows.rows){
   // The same pg.Client sees uncommitted absences and company closures.
   const capacity=await readDevelopmentCapacity(db,row.start_on,row.end_on,{teamId,externalTransaction:true});
   sources[row.cycle_type+":"+row.cycle_id]={CAL_CAPACITY_JH:capacity.status==="calculated"&&capacity.totalJh!==null?
    String(capacity.totalJh):null};
  }
  const output=await recalculateIndicatorResultsWithinTransaction(db,{teamId,cycles:scopes,
   changedCalendarTags:[...CALENDAR_CHANGE_TAGS],calendarSources:sources});
  cycles+=output.cycles;results+=output.results;
 }
 await db.query("UPDATE public.smn_indicator_system_revision SET revision=revision+1,updated_at=now() WHERE singleton_key='singleton'");
 return {cycles,results};
}
