import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureTemplateSchema} from "./ceremony-templates";
import {readWorkSlots,workingIntervals,type WorkSlots} from "../capacity/work-slots";

export type TemplateSprint={id:string;startAt:string;endAt:string;timeZone:string};
export type OccurrenceTemplate={
 id:string;name:string;frequency:"daily"|"weekly"|"sprint";weekday:number|null;
 position:"start"|"end"|null;time:string;duration:number;revision:number
};
export type PlannedOccurrence={templateId:string;name:string;revision:number;startsAt:string;endsAt:string};

const isoDay=(date:string)=>new Date(date+"T00:00:00Z").getUTCDay()||7;
const plusDay=(date:string)=>new Date(Date.parse(date+"T00:00:00Z")+86400000).toISOString().slice(0,10);
function localParts(at:Date,zone:string){
 const p=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(at);
 const m=Object.fromEntries(p.map(x=>[x.type,x.value]));
 return {date:`${m.year}-${m.month}-${m.day}`,time:`${m.hour}:${m.minute}`};
}
function resolveLocal(date:string,time:string,zone:string){
 const base=Date.parse(date+"T"+time+":00Z");
 for(let shift=-14*60;shift<=14*60;shift+=15){
  const at=new Date(base+shift*60000);
  const x=localParts(at,zone);
  if(x.date===date&&x.time===time)return at;
 }
 throw Error("template-local-time-unavailable");
}

/**
 * Placement métier des modèles : début/fin de Sprint = premier/dernier jour
 * OUVRÉ dans la période, indépendamment de la date calendaire de fin du Sprint.
 * Les heures configurées sont conservées lorsqu'elles rentrent dans les plages
 * de travail de l'équipe. Si elles ne rentrent pas, on prend la première
 * (début) ou la dernière (fin) plage compatible, sans inventer de nouvel horaire.
 * Les réunions hebdomadaires restent placées le jour explicitement configuré.
 * N'affecte jamais les occurrences d'un Sprint déjà enregistré.
 */
export function planTemplateOccurrences(
 sprint:TemplateSprint,
 templates:readonly OccurrenceTemplate[],
 unavailableDays:ReadonlySet<string>=new Set<string>(),
 slots:WorkSlots|null=null
):PlannedOccurrence[]{
 const first=new Date(sprint.startAt),endExclusive=new Date(sprint.endAt);
 if(!Number.isFinite(first.getTime())||!Number.isFinite(endExclusive.getTime())||
    first>=endExclusive)throw Error("template-invalid-sprint");
 const firstDate=localParts(first,sprint.timeZone).date;
 const lastDate=localParts(new Date(endExclusive.getTime()-1),sprint.timeZone).date;
 const dates:string[]=[];
 for(let date=firstDate;date<=lastDate;date=plusDay(date)){
  if(dates.length>=35)throw Error("template-sprint-too-long");
  dates.push(date);
 }
 const workingDays=dates.filter(date=>isoDay(date)<=5&&!unavailableDays.has(date));
 const initialWorkday=workingDays[0],finalWorkday=workingDays.at(-1);
 const scheduled:PlannedOccurrence[]=[];
 for(const tpl of templates){
  const isAnchored=tpl.frequency==="sprint";
  const selectedDates=tpl.frequency==="daily"?workingDays:
   tpl.frequency==="weekly"?dates.filter(date=>isoDay(date)===tpl.weekday):
   tpl.position==="start"?(initialWorkday?[initialWorkday]:[]):
   finalWorkday?[finalWorkday]:[];
  for(const date of selectedDates){
   let at=resolveLocal(date,tpl.time.slice(0,5),sprint.timeZone).getTime();
   let until=at+tpl.duration*60000;
   // Seuls les modèles ancrés au début/à la fin doivent rentrer dans
   // une plage de travail ; les réunions hebdomadaires restent explicites.
   if(isAnchored&&slots){
    const windows=workingIntervals(date,sprint.timeZone,slots,{morning:true,afternoon:true});
    if(!windows)throw Error("template-work-slots-unavailable");
    if(!windows.some(w=>at>=w.start&&until<=w.end)){
     const candidates=windows.filter(w=>w.end-w.start>=tpl.duration*60000);
     if(!candidates.length)throw Error("template-duration-exceeds-work-slot");
     at=tpl.position==="start"?candidates[0].start:candidates.at(-1)!.end-tpl.duration*60000;
     until=at+tpl.duration*60000;
    }
   }
   // Respecter les bornes exactes du Sprint, y compris les horaires partiels.
   if(at<first.getTime()||until>endExclusive.getTime())continue;
   scheduled.push({templateId:tpl.id,name:tpl.name,revision:tpl.revision,
    startsAt:new Date(at).toISOString(),endsAt:new Date(until).toISOString()});
  }
 }
 return scheduled;
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
 await db.query("ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS generation_source text NOT NULL DEFAULT 'standard'");
 await db.query("ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes BETWEEN 0 AND 1440)");
}
export async function saveTemplateOccurrences(db:Client,sprint:TemplateSprint,options:{reconstructed?:boolean}={}){
 await ensureTemplateOccurrenceSchema(db);
 const team=await db.query<{team_id:string}>("SELECT team_id FROM public.smn_sprint WHERE id=$1",[sprint.id]);
 if(!team.rows[0])throw Error("sprint-not-found");
 const teamId=team.rows[0].team_id;
 const templates=await db.query<OccurrenceTemplate>(`SELECT id,name,frequency,weekday,position,local_time::text AS time,duration_minutes AS duration,revision
 FROM public.smn_scrum_ceremony_template WHERE team_id=$1 AND active=true ORDER BY id`,[teamId]);
 const first=new Date(sprint.startAt),last=new Date(sprint.endAt);
 if(last.getTime()<=Date.now()&&!options.reconstructed)return 0;
 if(templates.rows.length===0)return 0;
 const startDay=localParts(first,sprint.timeZone).date;
 const endDay=localParts(new Date(last.getTime()-1),sprint.timeZone).date;
 // Les jours chômés de l'équipe et les jours fériés connus du pays de
 // référence sont exclus des ancrages début/fin et des occurrences quotidiennes.
 const [closures,holidays,configuredSlots]=await Promise.all([
  db.query<{start_on:string;end_on:string}>(`SELECT start_on::text AS start_on,end_on::text AS end_on
   FROM public.smn_company_closure
   WHERE team_id=$1 AND is_active=true AND start_on <=$3::date AND end_on >=$2::date`,
   [teamId,startDay,endDay]),
  db.query<{holiday_date:string}>(`SELECT h.holiday_date::text AS holiday_date
   FROM public.smn_national_holiday h
   JOIN public.smn_general_settings g ON g.reference_country=h.country_code
   WHERE g.installation_id='singleton'
    AND h.holiday_date BETWEEN $1::date AND $2::date`,[startDay,endDay]),
  readWorkSlots(db,teamId)
 ]);
 const unavailable=new Set(holidays.rows.map(row=>row.holiday_date));
 for(const row of closures.rows) {
  for(let day=row.start_on;day<=row.end_on;day=plusDay(day)) {
   if(day>=startDay&&day<=endDay)unavailable.add(day);
  }
 }
 // Une zone de plages de travail différente de celle du Sprint rendrait
 // le placement indéterminé : ne pas effectuer de conversion arbitraire.
 if(configuredSlots&&configuredSlots.zone!==sprint.timeZone)
  throw Error("template-work-zone-mismatch");
 const planned=planTemplateOccurrences(sprint,templates.rows,unavailable,configuredSlots?.slots??null);
 let count=0;
 for(const x of planned){
  const inserted=await db.query(`INSERT INTO public.smn_scrum_template_occurrence
   (id,template_id,template_revision,sprint_id,name,starts_at,ends_at,generation_source)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING id`,
   [randomUUID(),x.templateId,x.revision,sprint.id,x.name,x.startsAt,x.endsAt,
    options.reconstructed?"reconstructed":"standard"]);
  count+=inserted.rowCount??0;
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
 t.active AS "templateActive",o.generation_source AS "generationSource"
 FROM public.smn_scrum_template_occurrence o
 JOIN public.smn_scrum_ceremony_template t ON t.id=o.template_id
 JOIN public.smn_sprint s ON s.id=o.sprint_id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL ORDER BY o.starts_at DESC LIMIT 500`,[team.rows[0].id]);
 return r.rows;
}
