import {randomUUID} from "node:crypto";
import type {Client} from "pg";

export type CeremonyKind="planning"|"daily"|"review"|"retrospective";
export type Ceremony={kind:CeremonyKind;startsAt:string;endsAt:string;minutes:number};
type Sprint={id:string;startAt:string;endAt:string;timeZone:string};
export type Timeboxes={planning:number;review:number;retrospective:number;daily:number;finalMargin:number};
export const defaultTimeboxes=(weeks:number):Timeboxes=>({
 planning:weeks*120,review:weeks*60,retrospective:weeks*45,daily:15,finalMargin:30
});
function localParts(value:Date,zone:string){
 const entries=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(value);
 const p=Object.fromEntries(entries.map(e=>[e.type,e.value]));
 return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};
}
function localInstant(date:string,time:string,zone:string):Date{
 const base=Date.parse(date+"T"+time+":00Z");
 if(!Number.isFinite(base))throw Error("invalid-local-instant");
 for(let offset=-14*60;offset<=14*60;offset+=15){
  const result=new Date(base+offset*60000);
  const p=localParts(result,zone);
  if(p.date===date&&p.time===time)return result;
 }
 throw Error("invalid-local-instant");
}
const day=(s:string)=>new Date(s+"T00:00:00Z").getUTCDay();
const nextDay=(s:string)=>new Date(Date.parse(s+"T00:00:00Z")+86400000).toISOString().slice(0,10);
const addMinutes=(date:Date,minutes:number)=>new Date(date.valueOf()+minutes*60000);
const ceremony=(kind:CeremonyKind,start:Date,minutes:number):Ceremony=>({kind,startsAt:start.toISOString(),endsAt:addMinutes(start,minutes).toISOString(),minutes});
export function computeCeremonies(sprint:Sprint,weeks:number,box:Timeboxes=defaultTimeboxes(weeks),nonWorking:string[]=[]):Ceremony[]{
 if(!Number.isInteger(weeks)||weeks<1||weeks>4||Object.values(box).some(v=>!Number.isInteger(v)||v<0||v>600))throw Error("invalid-timeboxes");
 const first=new Date(sprint.startAt),last=new Date(sprint.endAt);
 if(!Number.isFinite(first.valueOf())||!Number.isFinite(last.valueOf())||last<=first)throw Error("invalid-sprint");
 // Do not invent historical ceremonies when a Sprint is entered after its real end.
 if(last.getTime()<=Date.now())return [];
 const planning=ceremony("planning",first,box.planning);
 const reviewEnd=addMinutes(last,-box.finalMargin-box.retrospective);
 const retroStart=reviewEnd;
 const reviewStart=addMinutes(reviewEnd,-box.review);
 if(reviewStart<planning.endsAt)throw Error("ceremony-overlap");
 const items:Ceremony[]=[planning];
 const startLocal=localParts(first,sprint.timeZone);
 const endLocal=localParts(last,sprint.timeZone);
 let cursor=nextDay(startLocal.date);
 while(cursor<=endLocal.date){
  const weekday=day(cursor);
  if(weekday!==0&&weekday!==6&&!nonWorking.includes(cursor)){
   const daily=localInstant(cursor,startLocal.time,sprint.timeZone);
   if(daily>planning.endsAt&&addMinutes(daily,box.daily)<=reviewStart)items.push(ceremony("daily",daily,box.daily));
  }
  cursor=nextDay(cursor);
 }
 items.push(ceremony("review",reviewStart,box.review));
 items.push(ceremony("retrospective",retroStart,box.retrospective));
 return items;
}
export async function ensureCeremonySchema(db:Client){
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony(
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 kind text NOT NULL CHECK(kind IN ('planning','daily','review','retrospective')),
 starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 minutes integer NOT NULL CHECK(minutes>0),generated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at),UNIQUE(sprint_id,kind,starts_at)
 )`);
}
export async function saveGeneratedCeremonies(db:Client,sprint:Sprint,weeks:number){
 await ensureCeremonySchema(db);
 const ceremonies=computeCeremonies(sprint,weeks);
 for(const c of ceremonies)await db.query(`INSERT INTO public.smn_sprint_ceremony
 (id,sprint_id,kind,starts_at,ends_at,minutes) VALUES($1,$2,$3,$4,$5,$6)
 ON CONFLICT(sprint_id,kind,starts_at) DO NOTHING`,
 [randomUUID(),sprint.id,c.kind,c.startsAt,c.endsAt,c.minutes]);
 return ceremonies.length;
}
