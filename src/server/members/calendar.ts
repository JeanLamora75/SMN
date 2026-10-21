import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidDate} from "./assignment";

export type WorkDay=Readonly<{weekday:number;morning:boolean;afternoon:boolean}>;
export const DEFAULT_WEEK:readonly WorkDay[]=Object.freeze(
 Array.from({length:7},(_,i)=>Object.freeze({weekday:i+1,morning:i<5,afternoon:i<5})));
export type CalendarWrite=
 |{action:"weekly";revision:number;effectiveFrom:string;days:WorkDay[]}
 |{action:"exception";revision:number;onDate:string;morning:boolean;afternoon:boolean;note:string|null};
export type WeekRow={revision:number;effective_from:string;days:WorkDay[];created_at:string};
export type ExceptionRow={revision:number;on_date:string;morning:boolean;afternoon:boolean;note:string|null;created_at:string};
export type CalendarDay=Readonly<{onDate:string;status:"missing"|"configured";
 source:"missing"|"weekly"|"exception";slots:{morning:boolean;afternoon:boolean}|null;
 absenceDays:null;developmentCapacityJh:null}>;
export type CalendarState=Readonly<{memberId:string;teamId:string;contractPercent:number;
 archived:boolean;today:string;configured:boolean;suggestedWeek:readonly WorkDay[];
 current:WeekRow|null;weeks:WeekRow[];exceptions:ExceptionRow[];
 day:CalendarDay}>;
export type CalendarWriteResult={ok:true;action:CalendarWrite["action"];revision:number}|
 {ok:false;error:"invalid-input"|"not-found"|"archived"|"conflict"|
 "date-in-past"|"date-before-latest"|"weekly-missing"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const revisionValid=(v:unknown):v is number=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0;
export function validWeek(raw:unknown):raw is WorkDay[]{
 return Array.isArray(raw)&&raw.length===7&&raw.every((v,i)=>
  v!==null&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===3&&
  v.weekday===i+1&&typeof v.morning==="boolean"&&typeof v.afternoon==="boolean");
}
export function parseCalendarWrite(raw:unknown):CalendarWrite|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(!revisionValid(v.revision))return null;
 if(v.action==="weekly"&&Object.keys(v).length===4&&
  isValidDate(v.effectiveFrom)&&validWeek(v.days))
   return {action:"weekly",revision:v.revision,effectiveFrom:v.effectiveFrom,days:v.days.map(d=>({...d}))};
 if(v.action==="exception"&&Object.keys(v).length===6&&isValidDate(v.onDate)&&
  typeof v.morning==="boolean"&&typeof v.afternoon==="boolean"&&
  (v.note===null||typeof v.note==="string")){
  const note=typeof v.note==="string"?v.note.trim()||null:null;
  if(note!==null&&(note.length>200||/[\u0000-\u001f\u007f]/u.test(note)))return null;
  return {action:"exception",revision:v.revision,onDate:v.onDate,
   morning:v.morning,afternoon:v.afternoon,note};
 }
 return null;
}
export function resolveCalendarDay(weeks:readonly WeekRow[],exceptions:readonly ExceptionRow[],
 onDate:string):CalendarDay{
 if(!isValidDate(onDate))throw new Error("member-calendar-invalid-date");
 const applicable=weeks.filter(w=>w.effective_from<=onDate).sort(
  (a,b)=>a.effective_from.localeCompare(b.effective_from)||a.revision-b.revision).at(-1);
 if(!applicable)return {onDate,status:"missing",source:"missing",slots:null,
  absenceDays:null,developmentCapacityJh:null};
 if(!validWeek(applicable.days))throw new Error("member-calendar-corrupt-week");
 const exception=exceptions.filter(e=>e.on_date===onDate).sort((a,b)=>a.revision-b.revision).at(-1);
 const weekday=new Date(onDate+"T00:00:00.000Z").getUTCDay()||7;
 const day=applicable.days[weekday-1];
 const slots=exception?{morning:exception.morning,afternoon:exception.afternoon}:
  {morning:day.morning,afternoon:day.afternoon};
 return {onDate,status:"configured",source:exception?"exception":"weekly",slots,
  absenceDays:null,developmentCapacityJh:null};
}
async function member(client:Client,memberId:string,lock:boolean){
 const result=await client.query<{id:string;archived_at:string|null;team_id:string;contract_percent:number}>(
  `SELECT m.id,m.archived_at::text AS archived_at,b.team_id,m.contract_percent
    FROM public.smn_member m
    JOIN public.smn_member_batch b ON b.id=m.batch_id AND b.installation_id=m.installation_id
    JOIN public.smn_team t ON t.id=b.team_id AND t.installation_id=m.installation_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE m.id=$1 AND m.installation_id='singleton' AND i.state='initialized'
      AND i.mode IN ('scrum','kanban')`+(lock?" FOR UPDATE OF m":""),[memberId]);
 return result.rows.length===1?result.rows[0]:null;
}
async function fetchWeeks(client:Client,id:string):Promise<WeekRow[]>{
 const r=await client.query<WeekRow>(`SELECT revision,effective_from::text AS effective_from,
  days,created_at::text AS created_at FROM public.smn_member_calendar_week WHERE member_id=$1
  ORDER BY revision ASC LIMIT 201`,[id]);
 if(r.rows.length>200||r.rows.some(w=>!validWeek(w.days)))throw new Error("member-calendar-week-corrupt");
 return r.rows;
}
async function fetchExceptions(client:Client,id:string):Promise<ExceptionRow[]>{
 const r=await client.query<ExceptionRow>(`SELECT revision,on_date::text AS on_date,morning,afternoon,
  note,created_at::text AS created_at FROM public.smn_member_calendar_exception WHERE member_id=$1
  ORDER BY on_date ASC,revision ASC LIMIT 501`,[id]);
 if(r.rows.length>500)throw new Error("member-calendar-exception-limit");
 return r.rows;
}
async function dbToday(client:Client){
 const r=await client.query<{today:string}>("SELECT CURRENT_DATE::text AS today");
 if(!isValidDate(r.rows[0]?.today))throw new Error("member-calendar-clock-unavailable");
 return r.rows[0].today;
}
export async function readMemberCalendar(client:Client,memberId:string,onDate?:string):Promise<CalendarState>{
 if(!UUID.test(memberId)||(onDate!==undefined&&!isValidDate(onDate)))
  throw new Error("member-calendar-invalid-input");
 const m=await member(client,memberId,false);
 if(!m)throw new Error("member-not-found");
 const today=await dbToday(client);
 const weeks=await fetchWeeks(client,memberId);
 const exceptions=await fetchExceptions(client,memberId);
 const current=weeks.filter(w=>w.effective_from<=today).sort((a,b)=>
  a.effective_from.localeCompare(b.effective_from)||a.revision-b.revision).at(-1)??null;
 return {memberId,teamId:m.team_id,contractPercent:m.contract_percent,
  archived:m.archived_at!==null,today,configured:current!==null,
  suggestedWeek:DEFAULT_WEEK,current,weeks,exceptions,
  day:resolveCalendarDay(weeks,exceptions,onDate??today)};
}
export async function saveMemberCalendar(client:Client,memberId:string,actorId:string,
 raw:unknown):Promise<CalendarWriteResult>{
 const input=parseCalendarWrite(raw);
 if(!UUID.test(memberId)||!actorId||!input)return {ok:false,error:"invalid-input"};
 await client.query("BEGIN");
 try{
  const fail=async(error:Exclude<CalendarWriteResult,{ok:true}>["error"]):Promise<CalendarWriteResult>=>{
   await client.query("ROLLBACK");return {ok:false,error};
  };
  const m=await member(client,memberId,true);
  if(!m)return fail("not-found");
  if(m.archived_at!==null)return fail("archived");
  const today=await dbToday(client);
  const date=input.action==="weekly"?input.effectiveFrom:input.onDate;
  if(date<today)return fail("date-in-past");
  const weeks=await fetchWeeks(client,memberId);
  if(input.action==="weekly"){
   const latest=weeks.at(-1)??null;
   if((latest?.revision??0)!==input.revision)return fail("conflict");
   if(latest&&input.effectiveFrom<latest.effective_from)return fail("date-before-latest");
   await client.query(`INSERT INTO public.smn_member_calendar_week
    (id,member_id,revision,effective_from,days,created_by)
    VALUES ($1,$2,$3,$4::date,$5::jsonb,$6)`,
    [randomUUID(),memberId,input.revision+1,input.effectiveFrom,JSON.stringify(input.days),actorId]);
  }else{
   if(!weeks.some(w=>w.effective_from<=date))return fail("weekly-missing");
   const exceptions=await fetchExceptions(client,memberId);
   const latest=exceptions.filter(e=>e.on_date===date).at(-1)??null;
   if((latest?.revision??0)!==input.revision)return fail("conflict");
   await client.query(`INSERT INTO public.smn_member_calendar_exception
    (id,member_id,on_date,revision,morning,afternoon,note,created_by)
    VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8)`,
    [randomUUID(),memberId,date,input.revision+1,input.morning,input.afternoon,input.note,actorId]);
  }
  await client.query("COMMIT");
  return {ok:true,action:input.action,revision:input.revision+1};
 }catch(error){
  await client.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
