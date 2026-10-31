import type {Client} from "pg";
import {ensureKanbanFlowSchema} from "./flow-counts";
import {ensureKanbanTimingSchema} from "./timing";
export type TrendPeriod={id:string;name:string;startOn:string;endOn:string;status:string;started:number|null;throughput:number|null;wipFinal:number|null};
export function selectKanbanTrends(items:TrendPeriod[],selected:{startOn:string;id:string}){
 return items.filter(p=>(p.startOn<selected.startOn||(p.startOn===selected.startOn&&p.id===selected.id)))
  .sort((a,b)=>b.startOn.localeCompare(a.startOn)||b.id.localeCompare(a.id)).slice(0,5)
  .reverse();
}
export type TimingTrend={id:string;name:string;startOn:string;cycleDays:number|null;leadDays:number|null};
export function selectTimingTrends(items:(TimingTrend&{status:string})[],selected:{startOn:string;id:string}):TimingTrend[]{
 return items.filter(p=>(p.startOn<selected.startOn||(p.startOn===selected.startOn&&p.id===selected.id)))
 .sort((a,b)=>b.startOn.localeCompare(a.startOn)||b.id.localeCompare(a.id))
 .slice(0,5).reverse().map(({id,name,startOn,cycleDays,leadDays})=>({id,name,startOn,cycleDays,leadDays}));
}
export async function readKanbanTrends(db:Client,periodId:string){
 await ensureKanbanFlowSchema(db);
 await ensureKanbanTimingSchema(db);
 const target=await db.query<{id:string;team_id:string;start_on:string}>(`SELECT p.id,p.team_id,p.start_on::text
 FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'`,[periodId]);
 if(!target.rows[0])return null;
 const t=target.rows[0];
 const result=await db.query<{id:string;name:string;start_on:string;end_on:string;status:string;started:string|null;throughput:string|null;wip_final:string|null;cycle_days:string|null;lead_days:string|null;cycle_convention:string|null;lead_convention:string|null}>(`
 SELECT p.id,p.name,p.start_on::text,p.end_on::text,p.status,
 c.started::text,c.throughput::text,c.wip_final::text,
 tm.cycle_days::text,tm.lead_days::text,tm.cycle_convention,tm.lead_convention
 FROM public.smn_kanban_period p
 LEFT JOIN public.smn_kanban_flow_counts c ON c.period_id=p.id
 LEFT JOIN public.smn_kanban_timing tm ON tm.period_id=p.id
 WHERE p.team_id=$1 AND p.deleted_at IS NULL
 AND (p.start_on<$2::date OR (p.start_on=$2::date AND p.id=$3))
 ORDER BY p.start_on DESC,p.id DESC LIMIT 6`,[t.team_id,t.start_on,t.id]);
 const periods=result.rows.map(p=>({id:p.id,name:p.name,startOn:p.start_on,endOn:p.end_on,status:p.status,
  started:p.started===null?null:Number(p.started),throughput:p.throughput===null?null:Number(p.throughput),
  wipFinal:p.wip_final===null?null:Number(p.wip_final),
  cycleDays:p.cycle_convention==="calendar"&&p.cycle_days!==null?Number(p.cycle_days):null,
  leadDays:p.lead_convention==="calendar"&&p.lead_days!==null?Number(p.lead_days):null})).reverse();
 return {periods};
}
