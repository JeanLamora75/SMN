import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureCadenceTable} from "./cadence";
import {saveGeneratedCeremonies} from "./ceremonies";

type Cadence={duration_weeks:number;start_day:number;start_time:string;end_day:number;end_time:string;time_zone:string};
type SprintRow={id:string;name:string;start_at:string;end_at:string;number:number;status:string};
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
function dateParts(value:string){
 if(!datePattern.test(value))throw Error("invalid-date");
 const d=new Date(value+"T00:00:00Z");
 if(!Number.isFinite(d.valueOf())||d.toISOString().slice(0,10)!==value)throw Error("invalid-date");
 return d;
}
function addDays(date:Date,days:number){const d=new Date(date);d.setUTCDate(d.getUTCDate()+days);return d;}
const iso=(d:Date)=>d.toISOString().slice(0,10);
const day=(d:Date)=>d.getUTCDay()||7;
function zonedParts(instant:Date,zone:string){
 const p=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(instant);
 return Object.fromEntries(p.map(x=>[x.type,x.value]));
}
function instantAt(localDate:string,time:string,zone:string):Date{
 const wanted=localDate+" "+time;
 const utcBase=Date.parse(localDate+"T"+time+":00Z");
 if(!Number.isFinite(utcBase))throw Error("invalid-date");
 // Resolve IANA offset without assuming a fixed 24-hour UTC day across DST.
 const matches:Date[]=[];
 for(let delta=-14*60;delta<=14*60;delta+=15){
  const d=new Date(utcBase+delta*60000);
  const p=zonedParts(d,zone);
  if(`${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`===wanted)matches.push(d);
 }
 if(matches.length===0)throw Error("nonexistent-local-time");
 return matches[0];
}
export function calculateSprint(startOn:string,c:Cadence){
 const requested=dateParts(startOn);
 const shift=(c.start_day-day(requested)+7)%7;
 const first=addDays(requested,shift);
 const lastWeekStart=addDays(first,(c.duration_weeks-1)*7);
 const last=addDays(lastWeekStart,(c.end_day-c.start_day+7)%7);
 const startAt=instantAt(iso(first),c.start_time.slice(0,5),c.time_zone);
 const endAt=instantAt(iso(last),c.end_time.slice(0,5),c.time_zone);
 if(endAt<=startAt)throw Error("invalid-period");
 return {startOn:iso(first),endOn:iso(last),startAt:startAt.toISOString(),endAt:endAt.toISOString(),timeZone:c.time_zone};
}
export async function ensureSprintSchema(db:Client){
 await ensureCadenceTable(db);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint(
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 number integer NOT NULL CHECK(number>0),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 160),
 start_at timestamptz NOT NULL,
 end_at timestamptz NOT NULL,
 time_zone text NOT NULL,
 status text NOT NULL DEFAULT 'planned',
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 deleted_at timestamptz,
 deleted_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 CHECK(end_at>start_at),
 UNIQUE(team_id,number)
 )`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_audit(
 id text PRIMARY KEY, sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 action text NOT NULL, actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(), details jsonb NOT NULL
 )`);
}
async function context(db:Client){
 const t=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version<=27 AND lower(i.mode)='scrum'`);
 if(t.rows.length!==1)throw Error("scrum-team-unavailable");
 const teamId=t.rows[0].id;
 await db.query("INSERT INTO public.smn_scrum_cadence(team_id) VALUES($1) ON CONFLICT DO NOTHING",[teamId]);
 const cad=await db.query<Cadence>("SELECT duration_weeks,start_day,start_time::text,end_day,end_time::text,time_zone FROM public.smn_scrum_cadence WHERE team_id=$1",[teamId]);
 if(cad.rows.length!==1)throw Error("cadence-unavailable");
 return {teamId,cadence:cad.rows[0]};
}
async function latest(db:Client,teamId:string){
 const r=await db.query<SprintRow>("SELECT id,name,start_at::text,end_at::text,number,status FROM public.smn_sprint WHERE team_id=$1 AND deleted_at IS NULL ORDER BY end_at DESC,id DESC LIMIT 1",[teamId]);
 const count=await db.query<{next_number:number}>("SELECT COALESCE(MAX(number),0)+1 AS next_number FROM public.smn_sprint WHERE team_id=$1 AND deleted_at IS NULL",[teamId]);
 return {last:r.rows[0]??null,nextNumber:count.rows[0]?.next_number??1};
}
const formatSprintDate=(value:string)=>`${value.slice(8,10)}/${value.slice(5,7)}/${value.slice(0,4)}`;
const suggest=(startOn:string,endOn:string)=>`Sprint du ${formatSprintDate(startOn)} au ${formatSprintDate(endOn)}`;
export async function sprintProposal(db:Client,startOn?:string){
 await ensureSprintSchema(db);
 const {teamId,cadence}=await context(db);
 const {last,nextNumber}=await latest(db,teamId);
 const localEnd=last?zonedParts(new Date(last.end_at),cadence.time_zone):null;
 const recommended=localEnd?iso(addDays(dateParts(`${localEnd.year}-${localEnd.month}-${localEnd.day}`),1)):null;
 const selected=startOn??recommended;
 if(!selected)return {first:true,nextNumber,recommended:null,proposal:null};
 const dates=calculateSprint(selected,cadence);
 return {first:!last,nextNumber,recommended,proposal:{...dates,name:suggest(dates.startOn,dates.endOn)}};
}
export async function createSprint(db:Client,actorId:string,input:unknown){
 if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false as const,error:"invalid-input" as const};
 const o=input as Record<string,unknown>;
 if(Object.keys(o).some(k=>!["startOn","name"].includes(k))||typeof o.startOn!=="string"||
 (o.name!==undefined&&(typeof o.name!=="string"||o.name.trim().length<1||o.name.trim().length>160)))
 return {ok:false as const,error:"invalid-input" as const};
 try{dateParts(o.startOn);}catch{return {ok:false as const,error:"invalid-input" as const};}
 await ensureSprintSchema(db);
 await db.query("BEGIN");
 try{
  const {teamId,cadence}=await context(db);
  // Serialize all sprint creation for this team, including concurrent requests.
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[teamId]);
  const {nextNumber}=await latest(db,teamId);
  const dates=calculateSprint(o.startOn,cadence);
  const overlap=await db.query("SELECT 1 FROM public.smn_sprint WHERE team_id=$1 AND deleted_at IS NULL AND start_at<$3 AND end_at>$2 LIMIT 1",[teamId,dates.startAt,dates.endAt]);
  if(overlap.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"overlap" as const};}
  const name=typeof o.name==="string"?o.name.trim():suggest(dates.startOn,dates.endOn);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,created_by)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,teamId,nextNumber,name,dates.startAt,dates.endAt,dates.timeZone,actorId]);
  await db.query(`INSERT INTO public.smn_sprint_audit(id,sprint_id,action,actor_id,details)
  VALUES($1,$2,'created',$3,$4::jsonb)`,[randomUUID(),id,actorId,JSON.stringify({number:nextNumber,name,...dates})]);
  await saveGeneratedCeremonies(db,{id,startAt:dates.startAt,endAt:dates.endAt,timeZone:dates.timeZone},cadence.duration_weeks);
  await db.query("COMMIT");
  return {ok:true as const,sprint:{id,number:nextNumber,name,...dates}};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
