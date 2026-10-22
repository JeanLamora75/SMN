import type {Client} from "pg";
import {unionDurationMinutes,type Interval} from "./meeting-intervals";

export type WorkSlots={morningStart:string;morningEnd:string;afternoonStart:string;afternoonEnd:string};
const toMinutes=(s:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?Number(s.slice(0,2))*60+Number(s.slice(3)):NaN;
export function validWorkSlots(x:unknown):x is WorkSlots{
 if(!x||typeof x!=="object"||Array.isArray(x))return false;
 const v=x as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="afternoonEnd,afternoonStart,morningEnd,morningStart")return false;
 if(Object.values(v).some(y=>typeof y!=="string"))return false;
 const [a,b,c,d]=[v.morningStart,v.morningEnd,v.afternoonStart,v.afternoonEnd].map(y=>toMinutes(y as string));
 return [a,b,c,d].every(Number.isFinite)&&a<b&&b<=c&&c<d;
}
/** Resolve a civil time only when exactly one UTC instant exists (DST ambiguity is unsafe). */
export function resolveLocalMinute(date:string,time:string,zone:string):number|null{
 const base=Date.parse(date+"T"+time+":00.000Z");
 if(!Number.isFinite(base))return null;
 const matches:number[]=[];
 const formatter=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
 for(let delta=-14*60;delta<=14*60;delta+=15){
  const instant=base+delta*60000;
  const obj=Object.fromEntries(formatter.formatToParts(new Date(instant)).map(x=>[x.type,x.value]));
  if(`${obj.year}-${obj.month}-${obj.day} ${obj.hour}:${obj.minute}`===date+" "+time)matches.push(instant);
 }
 return matches.length===1?matches[0]:null;
}
export function workingIntervals(date:string,zone:string,slots:WorkSlots,available:{morning:boolean;afternoon:boolean}):Interval[]|null{
 if(!validWorkSlots(slots))return null;
 const segments:[boolean,string,string][]=[[available.morning,slots.morningStart,slots.morningEnd],[available.afternoon,slots.afternoonStart,slots.afternoonEnd]];
 const out:Interval[]=[];
 for(const [enabled,start,end] of segments){
  if(!enabled)continue;
  const a=resolveLocalMinute(date,start,zone),b=resolveLocalMinute(date,end,zone);
  if(a===null||b===null||a>=b)return null;
  out.push({start:a,end:b});
 }
 return out;
}
export function occupiedMinutes(meetings:readonly Interval[],work:readonly Interval[]):number{
 return work.reduce((n,slot)=>n+unionDurationMinutes(meetings,slot),0);
}
export async function readWorkSlots(db:Client,teamId:string):Promise<{slots:WorkSlots;zone:string}|null>{
 const r=await db.query<{morning_start:string;morning_end:string;afternoon_start:string;afternoon_end:string;time_zone:string}>(`SELECT morning_start::text,morning_end::text,afternoon_start::text,afternoon_end::text,time_zone
 FROM public.smn_team_work_slots WHERE team_id=$1`,[teamId]);
 const x=r.rows[0];if(!x)return null;
 const slots={morningStart:x.morning_start.slice(0,5),morningEnd:x.morning_end.slice(0,5),afternoonStart:x.afternoon_start.slice(0,5),afternoonEnd:x.afternoon_end.slice(0,5)};
 return validWorkSlots(slots)?{slots,zone:x.time_zone}:null;
}
