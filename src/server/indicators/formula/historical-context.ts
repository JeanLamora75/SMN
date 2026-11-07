import type {Client} from "pg";
import {calculateHistorical,type HistoricalPoint,type HistoricalSeries} from "./history";
import type {HistoricalFunction,HistoricalResolver,Result,SourceValue} from "./index";

export type HistoricalContextResolver=HistoricalResolver & {series:(tag:string,count:number)=>HistoricalSeries};
export type HistoryScope=Readonly<{teamId:string;cycleType:"scrum"|"kanban";cycleId:string}>;
type Cycle={id:string;name:string;status:string;start_date:string;end_date:string};
type Stored={cycle_id:string;indicator_id:string;value:string|null};
type Snapshot={sprint_id:string;snapshot:unknown};

/** Historical reads never cross the active team or include future cycles. */
export async function loadHistoricalResolver(db:Client,scope:HistoryScope,byTag:ReadonlyMap<string,string>):Promise<HistoricalContextResolver>{
 const scrum=scope.cycleType==="scrum";
 const table=scrum?"smn_sprint":"smn_kanban_period";
 const date= scrum?"start_at":"start_on";
 const endDate=scrum?"end_at":"end_on";
 const cycles=await db.query<Cycle>(`SELECT id,name,status,
  ${date}::date::text AS start_date,${endDate}::date::text AS end_date
  FROM public.${table}
 WHERE team_id=$1 AND deleted_at IS NULL ORDER BY ${date},id LIMIT 1001`,[scope.teamId]);
 if(cycles.rows.length>1000)throw Error("historical-cycle-budget");
 const index=cycles.rows.findIndex(c=>c.id===scope.cycleId);
 if(index<0)throw Error("historical-cycle-not-found");
 const selected=cycles.rows.slice(0,index+1);
 const ids=selected.map(c=>c.id);
 const values=new Map<string,Map<string,string|null>>();
 for(const cycle of selected)values.set(cycle.id,new Map());
 if(ids.length){
  const manual=await db.query<Stored>(`SELECT cycle_id,indicator_id,value::text AS value FROM public.smn_indicator_manual_value
 WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=ANY($3::text[])`,[scope.teamId,scope.cycleType,ids]);
  const computed=await db.query<Stored>(`SELECT cycle_id,indicator_id,CASE WHEN result_state='available' THEN value::text ELSE NULL END AS value
 FROM public.smn_indicator_computed_result
 WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=ANY($3::text[])`,[scope.teamId,scope.cycleType,ids]);
  for(const record of [...manual.rows,...computed.rows])values.get(record.cycle_id)?.set(record.indicator_id,record.value);
 }
 if(scrum){
  const closed=selected.filter(c=>c.status==="closed").map(c=>c.id);
  if(closed.length){
   const snapshots=await db.query<Snapshot>(`SELECT snap.sprint_id,snap.snapshot FROM public.smn_sprint_closure_snapshot snap
 JOIN public.smn_sprint s ON s.id=snap.sprint_id AND s.team_id=$1
 WHERE snap.sprint_id=ANY($2::text[]) ORDER BY snap.sprint_id,snap.version DESC`,[scope.teamId,closed]);
   const first=new Set<string>();
   for(const row of snapshots.rows){
    if(first.has(row.sprint_id))continue;
    first.add(row.sprint_id);
    const snapshot=row.snapshot&&typeof row.snapshot==="object"&&!Array.isArray(row.snapshot)?row.snapshot as Record<string,unknown>:null;
    const stored=Array.isArray(snapshot?.indicatorsV33)?snapshot.indicatorsV33:[];
    const frozen=new Map<string,string|null>();
    for(const entry of stored){
     if(entry&&typeof entry==="object"&&"id" in entry&&typeof entry.id==="string"&&"value" in entry)
      frozen.set(entry.id,typeof entry.value==="string"?entry.value:null);
    }
    values.set(row.sprint_id,frozen);
   }
   for(const id of closed)if(!first.has(id))values.set(id,new Map());
  }
 }
 /** Calendar boundaries follow the app's cycle interval: start included, end excluded.
  * Parse the ISO calendar dates in UTC to avoid DST or host-timezone drift.
  */
 const durationDays=(cycle:Cycle):number|null=>{
  const valid=/^\\d{4}-\\d{2}-\\d{2}$/;
  if(!valid.test(cycle.start_date)||!valid.test(cycle.end_date))return null;
  const start=Date.parse(cycle.start_date+"T00:00:00Z");
  const end=Date.parse(cycle.end_date+"T00:00:00Z");
  if(!Number.isFinite(start)||!Number.isFinite(end))return null;
  const days=(end-start)/86400000;
  return Number.isSafeInteger(days)&&days>0?days:null;
 };
 const series=(tag:string,count:number):HistoricalSeries=>{
  const indicatorId=byTag.get(tag);
  if(!indicatorId)throw Error("historical-tag-unknown");
  const points:HistoricalPoint[]=selected.map(c=>({cycleId:c.id,label:c.name,value:values.get(c.id)?.get(indicatorId)??null,durationDays:durationDays(c)}));
  const result=calculateHistorical("LAST_VALUES",points,count);
  if(result.kind!=="series")throw Error("historical-series-unavailable");
  return result;
 };
 const resolver:HistoricalResolver=(name:HistoricalFunction,tag:string,count:number,current?:SourceValue):Result=>{
  const indicatorId=byTag.get(tag);
  if(!indicatorId)return {kind:"unavailable",reason:"missing_source",sourceTag:tag};
  const points=[...series(tag,selected.length||1).points];
  if(selected.at(-1)?.status!=="closed"&&typeof current==="string"&&points.length)
   points[points.length-1]={...points[points.length-1],value:current};
  const result=calculateHistorical(name,points,count);
  if(result.kind==="series")return {kind:"unavailable",reason:"invalid_domain",detail:"series-result-requires-visualization"};
  return result;
 };
 return Object.assign(resolver,{series});
}
