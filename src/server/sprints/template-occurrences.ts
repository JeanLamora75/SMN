import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureTemplateSchema} from "./ceremony-templates";
type Sprint={id:string;startAt:string;endAt:string;timeZone:string};
type Template={id:string;name:string;frequency:"daily"|"weekly"|"sprint";weekday:number|null;position:"start"|"end"|null;time:string;duration:number;revision:number};
const isoDay=(date:string)=>new Date(date+"T00:00:00Z").getUTCDay()||7;
const plusDay=(date:string)=>new Date(Date.parse(date+"T00:00:00Z")+86400000).toISOString().slice(0,10);
function localParts(at:Date,zone:string){
 const p=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(at);
 const m=Object.fromEntries(p.map(x=>[x.type,x.value]));
 return {date:`${m.year}-${m.month}-${m.day}`,time:`${m.hour}:${m.minute}`};
}
function resolveLocal(date:string,time:string,zone:string){
 const base=Date.parse(date+"T"+time+":00Z");
 for(let shift=-14*60;shift<=14*60;shift+=15){const at=new Date(base+shift*60000);const x=localParts(at,zone);if(x.date===date&&x.time===time)return at;}
 throw Error("template-local-time-unavailable");
}
export async function ensureTemplateOccurrenceSchema(db:Client){
 await ensureTemplateSchema(db);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_scrum_template_occurrence(
 id text PRIMARY KEY,
 template_id text NOT NULL REFERENCES public.smn_scrum_ceremony_template(id) ON DELETE RESTRICT,
 template_revision integer NOT NULL,
 sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 name text NOT NULL,
 starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at),UNIQUE(template_id,sprint_id,starts_at))`);
 await db.query("ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled'");
 await db.query("ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false");
 await db.query("ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes BETWEEN 0 AND 1440)");
}
export async function saveTemplateOccurrences(db:Client,sprint:Sprint){
 await ensureTemplateOccurrenceSchema(db);
 const team=await db.query<{team_id:string}>("SELECT team_id FROM public.smn_sprint WHERE id=$1",[sprint.id]);
 if(!team.rows[0])throw Error("sprint-not-found");
 const templates=await db.query<{id:string;name:string;frequency:Template["frequency"];weekday:number|null;position:Template["position"];time:string;duration:number;revision:number}>(`SELECT id,name,frequency,weekday,position,local_time::text AS time,duration_minutes AS duration,revision
 FROM public.smn_scrum_ceremony_template WHERE team_id=$1 AND active=true`,[team.rows[0].team_id]);
 const first=new Date(sprint.startAt),last=new Date(sprint.endAt);
 if(last.getTime()<=Date.now())return 0;
 let count=0;
 for(const x of templates.rows){
  let cursor=localParts(first,sprint.timeZone).date;
  const end=localParts(last,sprint.timeZone).date;
  while(cursor<=end){
   const match=x.frequency==="daily"&&isoDay(cursor)<6||
     x.frequency==="weekly"&&isoDay(cursor)===x.weekday||
     x.frequency==="sprint"&&cursor===(x.position==="start"?localParts(first,sprint.timeZone).date:end);
   if(match){
    const at=resolveLocal(cursor,x.time.slice(0,5),sprint.timeZone);
    const until=new Date(at.getTime()+x.duration*60000);
    if(at>=first&&until<=last){
     const inserted=await db.query(`INSERT INTO public.smn_scrum_template_occurrence
     (id,template_id,template_revision,sprint_id,name,starts_at,ends_at)
     VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id`,
     [randomUUID(),x.id,x.revision,sprint.id,x.name,at.toISOString(),until.toISOString()]);
     count+=inserted.rowCount??0;
    }
   }
   cursor=plusDay(cursor);
  }
 }
 return count;
}

export async function listTemplateOccurrences(db:Client){
 await ensureTemplateOccurrenceSchema(db);
 const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(team.rows.length!==1)throw Error("scrum-team-unavailable");
 const r=await db.query(`SELECT o.id,o.template_id AS "templateId",o.template_revision AS "templateRevision",
 o.sprint_id AS "sprintId",s.name AS "sprintName",o.name,
 o.starts_at::text AS "startAt",o.ends_at::text AS "endAt",s.time_zone AS "timeZone",
 t.active AS "templateActive"
 FROM public.smn_scrum_template_occurrence o
 JOIN public.smn_scrum_ceremony_template t ON t.id=o.template_id
 JOIN public.smn_sprint s ON s.id=o.sprint_id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL ORDER BY o.starts_at DESC LIMIT 500`,[team.rows[0].id]);
 return r.rows;
}
