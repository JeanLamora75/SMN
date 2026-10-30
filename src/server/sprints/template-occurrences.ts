import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureTemplateSchema} from "./ceremony-templates";
import {readWorkSlots,type WorkSlots} from "@/server/capacity/work-slots";
import {planSprintTemplateOccurrences,DEFAULT_TEAM_SLOTS,type SprintTemplate}
 from "./template-working-boundaries";
export {planSprintTemplateOccurrences} from "./template-working-boundaries";

type Sprint={id:string;startAt:string;endAt:string;timeZone:string};
function localDay(instant:Date,zone:string){
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{
  timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(instant).map(x=>[x.type,x.value]));
 return p.year+"-"+p.month+"-"+p.day;
}
const nextDay=(d:string)=>new Date(Date.parse(d+"T00:00:00Z")+86400000).toISOString().slice(0,10);
async function teamWorkSlots(db:Client,teamId:string):Promise<WorkSlots>{
 const exists=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_team_work_slots') IS NOT NULL AS present");
 if(exists.rows[0]?.present){
  const configured=await readWorkSlots(db,teamId);
  if(configured)return configured.slots;
 }
 return DEFAULT_TEAM_SLOTS;
}
async function blockedTeamDates(db:Client,teamId:string,start:string,end:string){
 // Une fermeture d'entreprise ne bloque l'équipe entière que si tous les
 // membres affectés ce jour sont concernés. Les anciens schémas utilisaient team_id.
 const closed=await db.query<{date:string}>([
  "WITH days AS (SELECT d::date AS day FROM generate_series($2::date,$3::date,interval '1 day') d),",
  "assigned AS (SELECT d.day,a.member_id,to_jsonb(m)->>'company_id' AS company_id",
  "FROM days d JOIN public.smn_member_assignment a ON a.team_id=$1",
  "AND a.start_on<=d.day AND (a.end_on IS NULL OR a.end_on>=d.day)",
  "JOIN public.smn_member m ON m.id=a.member_id),",
  "covered AS (SELECT a.day,a.member_id,EXISTS(",
  "SELECT 1 FROM public.smn_company_closure c",
  "WHERE c.is_active=true AND c.start_on<=a.day AND c.end_on>=a.day",
  "AND (to_jsonb(c)->>'team_id'=$1 OR (a.company_id IS NOT NULL",
  "AND to_jsonb(c)->>'company_id'=a.company_id))) AS closed",
  "FROM assigned a)",
  "SELECT day::text AS date FROM covered GROUP BY day",
  "HAVING COUNT(*)>0 AND BOOL_AND(closed)"
 ].join(" "),[teamId,start,end]);
 const blocked=new Set<string>(closed.rows.map(row=>row.date));
 // Holiday only when all people assigned on that date observe it;
 // holidays affecting only part of an international team are not team closures.
 const holidays=await db.query<{date:string}>([
  "WITH calendar_days AS (",
  "SELECT d::date AS working_date",
  "FROM generate_series($2::date,$3::date,interval '1 day') d",
  "), assigned AS (",
  "SELECT DISTINCT d.working_date,a.member_id",
  "FROM calendar_days d JOIN public.smn_member_assignment a",
  "ON a.team_id=$1 AND a.start_on<=d.working_date",
  "AND (a.end_on IS NULL OR a.end_on>=d.working_date)",
  "), locations AS (",
  "SELECT a.working_date,a.member_id,",
  "(SELECT l.country_iso2 FROM public.smn_member_location l",
  "WHERE l.member_id=a.member_id AND l.effective_from<=a.working_date",
  "ORDER BY l.effective_from DESC,l.revision DESC LIMIT 1) AS country",
  "FROM assigned a",
  "), daily AS (",
  "SELECT l.working_date,l.member_id,",
  "(l.country IS NOT NULL AND EXISTS(",
  "SELECT 1 FROM public.smn_national_holiday h",
  "WHERE h.country_code=l.country AND h.holiday_date=l.working_date",
  ")) AS on_holiday FROM locations l",
  ") SELECT working_date::text AS date FROM daily",
  "GROUP BY working_date HAVING count(*)>0 AND bool_and(on_holiday)"
 ].join(" "),[teamId,start,end]);
 for(const day of holidays.rows)blocked.add(day.date);
 return blocked;
}

export async function ensureTemplateOccurrenceSchema(db:Client){
 const tables=["smn_scrum_template_occurrence"] as const;
 const state=await db.query<{present:string[]}>(`SELECT array_agg(c.relname)::text[] AS present FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname = ANY($1::text[]) AND c.relkind IN ('r','p')`,[tables]);
 if(tables.some(name=>!state.rows[0]?.present?.includes(name)))throw Error("ceremony-schema-not-ready: apply-ceremony-schema-v32");
}

export async function saveTemplateOccurrences(db:Client,sprint:Sprint,options:{reconstructed?:boolean;schemaPrevalidated?:boolean}={}){
 // Le parcours multiéquipes vérifie le schéma AVANT la transaction et ne lance aucun DDL.
 if(!options.schemaPrevalidated)await ensureTemplateOccurrenceSchema(db);
 const team=await db.query<{team_id:string}>("SELECT team_id FROM public.smn_sprint WHERE id=$1",[sprint.id]);
 if(!team.rows[0])throw Error("sprint-not-found");
 const teamId=team.rows[0].team_id;
 const templates=await db.query<SprintTemplate>([
  "SELECT id,name,frequency,weekday,position,local_time::text AS time,",
  "duration_minutes AS duration,revision",
  "FROM public.smn_scrum_ceremony_template WHERE team_id=$1 AND active=true",
  "ORDER BY local_time,id"
 ].join(" "),[teamId]);
 const first=new Date(sprint.startAt),last=new Date(sprint.endAt);
 if(last.getTime()<=Date.now()&&!options.reconstructed)return 0;
 const startDay=localDay(first,sprint.timeZone),endDay=localDay(last,sprint.timeZone);
 const [slots,blocked]=await Promise.all([
  teamWorkSlots(db,teamId),blockedTeamDates(db,teamId,startDay,endDay)
 ]);
 const scheduled=planSprintTemplateOccurrences(sprint,templates.rows,slots,blocked);
 const versions=new Map(templates.rows.map(x=>[x.id,x.revision]));
 let count=0;
 for(const item of scheduled){
  const inserted=await db.query([
   "INSERT INTO public.smn_scrum_template_occurrence",
   "(id,template_id,template_revision,sprint_id,name,starts_at,ends_at,generation_source)",
   "VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
   "ON CONFLICT DO NOTHING RETURNING id"
  ].join(" "),[randomUUID(),item.templateId,versions.get(item.templateId),sprint.id,
   item.name,item.startAt,item.endAt,options.reconstructed?"reconstructed":"standard"]);
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
