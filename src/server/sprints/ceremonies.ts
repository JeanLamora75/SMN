import type {Client} from "pg";
import type {Lunch} from "./lunch";
import {saveTemplateOccurrences} from "./template-occurrences";

export type CeremonyKind="planning"|"daily"|"review"|"retrospective";
export type Segment={startsAt:string;endsAt:string;minutes:number};
export type Ceremony={kind:CeremonyKind;startsAt:string;endsAt:string;minutes:number;segments?:Segment[]};
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
function splitAtLunch(kind:CeremonyKind, anchor:Date,minutes:number,zone:string,lunch:Lunch,backward=false):Ceremony{
 let remaining=minutes,cursor=new Date(anchor);
 const segments:Segment[]=[];
 while(remaining>0){
  const p=localParts(cursor,zone);
  const pauseStart=localInstant(p.date,lunch.start,zone),pauseEnd=localInstant(p.date,lunch.end,zone);
  if(!backward){
   if(cursor>=pauseStart&&cursor<pauseEnd){cursor=pauseEnd;continue;}
   const untilPause=cursor<pauseStart?Math.floor((pauseStart.getTime()-cursor.getTime())/60000):remaining;
   const size=Math.min(remaining,untilPause);
   if(size<=0)throw Error("invalid-segment");
   const end=addMinutes(cursor,size);
   segments.push({startsAt:cursor.toISOString(),endsAt:end.toISOString(),minutes:size});
   cursor=end;remaining-=size;
  }else{
   if(cursor>pauseStart&&cursor<=pauseEnd){cursor=pauseStart;continue;}
   const untilPause=cursor>pauseEnd?Math.floor((cursor.getTime()-pauseEnd.getTime())/60000):remaining;
   const size=Math.min(remaining,untilPause);
   if(size<=0)throw Error("invalid-segment");
   const start=addMinutes(cursor,-size);
   segments.unshift({startsAt:start.toISOString(),endsAt:cursor.toISOString(),minutes:size});
   cursor=start;remaining-=size;
  }
 }
 return {kind,startsAt:segments[0].startsAt,endsAt:segments[segments.length-1].endsAt,minutes,segments};
}

// Calcul historique conservé pour les anciennes données/tests : jamais utilisé par la nouvelle génération.
export function computeCeremonies(sprint:Sprint,weeks:number,box:Timeboxes=defaultTimeboxes(weeks),nonWorking:string[]=[],lunch:Lunch={start:"12:00",end:"13:00",revision:1},allowHistorical=false):Ceremony[]{
 if(!Number.isInteger(weeks)||weeks<1||weeks>4||Object.values(box).some(v=>!Number.isInteger(v)||v<0||v>600))throw Error("invalid-timeboxes");
 const first=new Date(sprint.startAt),last=new Date(sprint.endAt);
 if(!Number.isFinite(first.valueOf())||!Number.isFinite(last.valueOf())||last<=first)throw Error("invalid-sprint");
 // Do not invent historical ceremonies when a Sprint is entered after its real end.
 if(last.getTime()<=Date.now()&&!allowHistorical)return [];
 const planning=splitAtLunch("planning",first,box.planning,sprint.timeZone,lunch);
 const retro=splitAtLunch("retrospective",addMinutes(last,-box.finalMargin),box.retrospective,sprint.timeZone,lunch,true);
 const review=splitAtLunch("review",new Date(retro.startsAt),box.review,sprint.timeZone,lunch,true);
 const reviewStart=new Date(review.startsAt);
 if(reviewStart<new Date(planning.endsAt))throw Error("ceremony-overlap");
 const items:Ceremony[]=[planning];
 const startLocal=localParts(first,sprint.timeZone);
 const endLocal=localParts(last,sprint.timeZone);
 let cursor=nextDay(startLocal.date);
 while(cursor<=endLocal.date){
  const weekday=day(cursor);
  if(weekday!==0&&weekday!==6&&!nonWorking.includes(cursor)){
   const daily=localInstant(cursor,startLocal.time,sprint.timeZone);
   if(daily>new Date(planning.endsAt)){const one=splitAtLunch("daily",daily,box.daily,sprint.timeZone,lunch);if(new Date(one.endsAt)<=reviewStart)items.push(one);}
  }
  cursor=nextDay(cursor);
 }
 items.push(review);
 items.push(retro);
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
 await db.query("ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS generation_source text NOT NULL DEFAULT 'standard'");
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony_segment(
 ceremony_id text NOT NULL REFERENCES public.smn_sprint_ceremony(id) ON DELETE CASCADE,
 position integer NOT NULL CHECK(position>0),
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 minutes integer NOT NULL CHECK(minutes>0),
 PRIMARY KEY(ceremony_id,position),
 CHECK(ends_at>starts_at))`);
}
// Point d'entrée conservé pour les appels existants (simple, lot, assistant).
// Depuis le MVP unifié, seules les occurrences des modèles ACTIFS sont générées.
export async function saveGeneratedCeremonies(db:Client,sprint:Sprint,_weeks:number,options:{reconstructed?:boolean;expectedTeamId?:string}={}){
 // Les tables anciennes restent disponibles pour la lecture des Sprints de test.
 await ensureCeremonySchema(db);
 return saveTemplateOccurrences(db,sprint,{reconstructed:options.reconstructed===true,expectedTeamId:options.expectedTeamId});
}
