import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {evaluateSchemaCapability} from "@/server/schema/compatibility";

export type KanbanFrequency="monthly"|"weekly"|"biweekly";
export type KanbanCadence={frequency:KanbanFrequency;startDay:number;timeZone:string;revision:number;updatedAt:string};
type Row={frequency:KanbanFrequency;start_day:number;time_zone:string;revision:number;updated_at:string};
const select=`SELECT frequency,start_day,time_zone,revision,updated_at::text AS updated_at FROM public.smn_kanban_cadence WHERE team_id=$1`;
const map=(r:Row):KanbanCadence=>({frequency:r.frequency,startDay:r.start_day,timeZone:r.time_zone,revision:r.revision,updatedAt:r.updated_at});
export function parseKanbanCadence(input:unknown):Pick<KanbanCadence,"frequency"|"startDay"|"timeZone"|"revision">|null{
 if(!input||typeof input!=="object"||Array.isArray(input))return null;
 const value=input as Record<string,unknown>;
 if(Object.keys(value).sort().join(",")!=="frequency,revision,startDay,timeZone")return null;
 if(!["monthly","weekly","biweekly"].includes(String(value.frequency)))return null;
 if(!Number.isInteger(value.startDay)||Number(value.startDay)<1||Number(value.startDay)>7)return null;
 if(!Number.isSafeInteger(value.revision)||Number(value.revision)<1)return null;
 if(typeof value.timeZone!=="string"||value.timeZone.length>100||!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)*$/.test(value.timeZone))return null;
 try{new Intl.DateTimeFormat("en",{timeZone:value.timeZone});}catch{return null;}
 return value as ReturnType<typeof parseKanbanCadence> & object;
}
function dateUTC(value:string):Date{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error("invalid-date");
 const date=new Date(value+"T00:00:00.000Z");
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw Error("invalid-date");
 return date;
}
const iso=(d:Date)=>d.toISOString().slice(0,10);
/** Calendar dates are computed in UTC solely as date labels: no milliseconds-as-local-days arithmetic. */
export function kanbanBounds(reference:string,frequency:KanbanFrequency,startDay=1):{startOn:string;endOn:string}{
 if(!Number.isInteger(startDay)||startDay<1||startDay>7)throw Error("invalid-start-day");
 if(!["monthly","weekly","biweekly"].includes(frequency))throw Error("invalid-frequency");
 const date=dateUTC(reference);
 if(frequency==="monthly"){
  const y=date.getUTCFullYear(),m=date.getUTCMonth();
  return {startOn:iso(new Date(Date.UTC(y,m,1))),endOn:iso(new Date(Date.UTC(y,m+1,0)))};
 }
 const day=date.getUTCDay()||7;
 const start=new Date(date);
 start.setUTCDate(start.getUTCDate()-((day-startDay+7)%7));
 const end=new Date(start);
 end.setUTCDate(end.getUTCDate()+(frequency==="weekly"?6:13));
 return {startOn:iso(start),endOn:iso(end)};
}
export async function ensureKanbanCadenceTable(db:Client){
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_kanban_cadence (
 team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly','weekly','biweekly')),
 start_day integer NOT NULL DEFAULT 1 CHECK (start_day BETWEEN 1 AND 7),
 time_zone text NOT NULL DEFAULT 'Europe/Paris',
 revision integer NOT NULL DEFAULT 1 CHECK (revision>=1),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL
 )`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_kanban_cadence_audit (
 id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 revision integer NOT NULL,before_values jsonb NOT NULL,after_values jsonb NOT NULL,
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(team_id,revision)
 )`);
}
async function teamId(db:Client,actor:TeamActor,requestedTeamId?:string|null):Promise<string>{
 const state=await db.query<{schema_version:number}>(
  "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
 const version=state.rows[0]?.schema_version;
 if(evaluateSchemaCapability(version,"multi-team").ok){
  const team=await resolveAdminTeam(db,actor,requestedTeamId);
  if(team.mode!=="kanban")throw Error("kanban-team-unavailable");
  return team.team_id;
 }
 if(typeof version!=="number"||version<1||version>27)
  throw Error("kanban-schema-unavailable");
 if(requestedTeamId!=null)throw Error("kanban-team-unavailable");
 const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'`);
 if(r.rows.length!==1)throw Error("kanban-team-unavailable");
 return r.rows[0].id;
}
export async function readKanbanCadence(db:Client,actor:TeamActor,requestedTeamId?:string|null):Promise<KanbanCadence>{
 await ensureKanbanCadenceTable(db);
 const id=await teamId(db,actor,requestedTeamId);
 await db.query("INSERT INTO public.smn_kanban_cadence(team_id) VALUES($1) ON CONFLICT DO NOTHING",[id]);
 const r=await db.query<Row>(select,[id]);
 if(r.rows.length!==1)throw Error("kanban-cadence-unavailable");
 return map(r.rows[0]);
}
export async function updateKanbanCadence(db:Client,actor:TeamActor,raw:unknown,requestedTeamId?:string|null){
 const input=parseKanbanCadence(raw);
 if(!input)return {ok:false as const,error:"invalid-input" as const};
 await ensureKanbanCadenceTable(db);
 const id=await teamId(db);
 await db.query("BEGIN");
 try{
  await db.query("INSERT INTO public.smn_kanban_cadence(team_id) VALUES($1) ON CONFLICT DO NOTHING",[id]);
  const result=await db.query<Row>(select+" FOR UPDATE",[id]);
  if(result.rows.length!==1)throw Error("kanban-cadence-unavailable");
  const before=map(result.rows[0]);
  if(before.revision!==input.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  if(before.frequency===input.frequency&&before.startDay===input.startDay&&before.timeZone===input.timeZone){
   await db.query("COMMIT");return {ok:true as const,cadence:before,changed:false};
  }
  const updated=await db.query<Row>(`UPDATE public.smn_kanban_cadence
 SET frequency=$2,start_day=$3,time_zone=$4,revision=revision+1,updated_at=now(),updated_by=$5
 WHERE team_id=$1 RETURNING frequency,start_day,time_zone,revision,updated_at::text AS updated_at`,
  [id,input.frequency,input.startDay,input.timeZone,actor.accountId]);
  const after=map(updated.rows[0]);
  await db.query(`INSERT INTO public.smn_kanban_cadence_audit
 (id,team_id,revision,before_values,after_values,changed_by)
 VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
 [randomUUID(),id,after.revision,JSON.stringify(before),JSON.stringify(after),actor.accountId]);
  await db.query("COMMIT");
  return {ok:true as const,cadence:after,changed:true};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
