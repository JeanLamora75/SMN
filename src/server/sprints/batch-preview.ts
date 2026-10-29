import type {Client} from "pg";
import {calculateSprint,ensureSprintSchema} from "./creation";

type Cadence={duration_weeks:number;start_day:number;start_time:string;end_day:number;end_time:string;time_zone:string};
type Existing={id:string;name:string;start_at:string;end_at:string};
const dayMs=86400000;
const isDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
export function validBatchRequest(raw:unknown):raw is {startOn:string;count:number}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const v=raw as Record<string,unknown>;
 return Object.keys(v).length===2&&isDate(v.startOn as string)&&Number.isInteger(v.count)&&(v.count as number)>=1&&(v.count as number)<=6;
}
const overlaps=(a:{startAt:string;endAt:string},b:{startAt:string;endAt:string})=>a.startAt<b.endAt&&a.endAt>b.startAt;
export async function previewSprintBatch(db:Client,raw:unknown,scopedTeamId?:string){
 if(!validBatchRequest(raw))return {ok:false as const,error:"invalid-input" as const};
 await ensureSprintSchema(db);
 let id=scopedTeamId;
 if(!id){
  const version=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  if(!version.rows[0]||version.rows[0].schema_version>=28)
   throw Error("scrum-team-context-required");
  const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
  if(team.rows.length!==1)throw Error("scrum-team-unavailable");
  id=team.rows[0].id;
 }
 await db.query("INSERT INTO public.smn_scrum_cadence(team_id) VALUES($1) ON CONFLICT DO NOTHING",[id]);
 const c=await db.query<Cadence>("SELECT duration_weeks,start_day,start_time::text,end_day,end_time::text,time_zone FROM public.smn_scrum_cadence WHERE team_id=$1",[id]);
 if(c.rows.length!==1)throw Error("cadence-unavailable");
 const existing=await db.query<Existing>("SELECT id,name,start_at::text,end_at::text FROM public.smn_sprint WHERE team_id=$1 AND deleted_at IS NULL ORDER BY start_at",[id]);
 const count=await db.query<{next_number:number}>("SELECT COALESCE(MAX(number),0)+1 AS next_number FROM public.smn_sprint WHERE team_id=$1",[id]);
 const nextNumber=count.rows[0]?.next_number??1;
 const items:Array<{number:number;name:string;startOn:string;endOn:string;startAt:string;endAt:string;timeZone:string;conflicts:Array<{id:string;name:string;startAt:string;endAt:string;kind:"existing"|"batch"}>}>= [];
 let cursor=raw.startOn;
 for(let i=0;i<raw.count;i++){
  const dates=calculateSprint(cursor,c.rows[0]);
  const conflicts:typeof items[number]["conflicts"]=[];
  for(const e of existing.rows)if(overlaps(dates,{startAt:new Date(e.start_at).toISOString(),endAt:new Date(e.end_at).toISOString()}))
   conflicts.push({id:e.id,name:e.name,startAt:new Date(e.start_at).toISOString(),endAt:new Date(e.end_at).toISOString(),kind:"existing"});
  for(const prior of items)if(overlaps(dates,prior))
   conflicts.push({id:"batch-"+prior.number,name:prior.name,startAt:prior.startAt,endAt:prior.endAt,kind:"batch"});
  items.push({number:nextNumber+i,name:`Sprint du ${dates.startOn.slice(8,10)}/${dates.startOn.slice(5,7)}/${dates.startOn.slice(0,4)} au ${dates.endOn.slice(8,10)}/${dates.endOn.slice(5,7)}/${dates.endOn.slice(0,4)}`,...dates,conflicts});
  cursor=new Date(Date.parse(dates.startOn+"T00:00:00Z")+c.rows[0].duration_weeks*7*dayMs).toISOString().slice(0,10);
 }
 return {ok:true as const,items,valid:items.every(i=>i.conflicts.length===0),count:raw.count};
}
