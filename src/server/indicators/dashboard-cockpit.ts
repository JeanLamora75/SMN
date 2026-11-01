import type {Client} from "pg";
import {DASHBOARD_BLOCKS,readDashboardSlots} from "./dashboard-slots";
import {readIndicatorReporting} from "./reporting";
import type {FrozenIndicator} from "./closure-snapshot";
export type DashboardValue={id:string;tag:string;name:string;unit:string;state:"available"|"not-recorded"|"unavailable";value:string|null};
export type DashboardPosition={index:number;indicator:DashboardValue|null};
export type DashboardGroup={key:"story_points"|"tickets"|"complementary";positions:DashboardPosition[]};
export async function readDashboardCockpit(db:Client,teamId:string,cycleType:"scrum"|"kanban",cycleId?:string):Promise<DashboardGroup[]>{
 const slots=await readDashboardSlots(db,teamId);
 const groups=DASHBOARD_BLOCKS.map(block=>({key:block.key,positions:Array.from({length:block.count},(_,i)=>({index:i+1,indicator:null as DashboardValue|null}))}));
 if(!cycleId)return groups;
 const report=await readIndicatorReporting(db,teamId,"dashboard",cycleType,[cycleId]);
 const cycle=report.cycles.find(c=>c.id===cycleId);
 if(!cycle)return groups;
 let frozen:FrozenIndicator[]|null=null;
 let historical=false;
 if(cycleType==="scrum"&&cycle.status==="closed"){
  historical=true;
  const result=await db.query<{snapshot:unknown}>("SELECT snapshot FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1",[cycleId]);
  const snap=result.rows[0]?.snapshot;
  const obj=snap&&typeof snap==="object"&&!Array.isArray(snap)?snap as Record<string,unknown>:null;
  frozen=Array.isArray(obj?.indicatorsV33)?obj.indicatorsV33 as FrozenIndicator[]:null;
 }
 const byId=new Map(report.columns.map(column=>{
  const raw=cycle.values[column.id]??null;
  const saved=frozen?.find(item=>item.id===column.id);
  const state:DashboardValue["state"]=historical?(!saved?"unavailable":saved.state):raw===null?"not-recorded":"available";
  return [column.id,{id:column.id,tag:historical&&saved?saved.tag:column.tag,name:historical&&saved?saved.name:column.name,unit:historical&&saved?saved.unit:column.unit,state,value:historical?saved?.value??null:raw} as DashboardValue] as const;
 }));
 for(const slot of slots){
  const group=groups.find(g=>g.key===slot.block_key);
  const position=group?.positions.find(p=>p.index===slot.slot_index);
  if(position)position.indicator=byId.get(slot.indicator_id)??null;
 }
 return groups;
}
