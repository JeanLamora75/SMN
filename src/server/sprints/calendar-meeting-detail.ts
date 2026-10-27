import type {Client} from "pg";

export type CalendarMeetingKind="ceremony"|"template"|"exceptional";
export type CalendarMeetingDetail=Readonly<{
 id:string;kind:CalendarMeetingKind;name:string;sprintId:string;sprintName:string;
 sprintStatus:string;startAt:string;endAt:string;timeZone:string;
 status:string;statusExplicit:boolean|null;generationSource:string|null;
 plannedMinutes:number;actualMinutes:number|null;revision:number|null;ceremonyKind:string|null;
}>;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tables={
 ceremony:{table:"smn_sprint_ceremony",alias:"c",nameColumn:"kind",statusColumn:"occurrence_status"},
 template:{table:"smn_scrum_template_occurrence",alias:"o",nameColumn:"name",statusColumn:"status"},
 exceptional:{table:"smn_sprint_exceptional_meeting",alias:"m",nameColumn:"name",statusColumn:"status"}
} as const;
export function validCalendarMeetingRef(kind:string,id:string):kind is CalendarMeetingKind{
 return Object.prototype.hasOwnProperty.call(tables,kind)&&UUID.test(id);
}
type Row={
 id:string;name:string;sprint_id:string;sprint_name:string;sprint_status:string;
 start_at:string;end_at:string;time_zone:string;status:string;
 status_explicit:boolean|null;generation_source:string|null;
 planned_minutes:number;actual_minutes:number|null;revision:number|null;ceremony_kind:string|null;
};
/** Read-only and team-scoped. The kind-to-table mapping is a constant whitelist. */
export async function readCalendarMeeting(db:Client,kind:string,id:string,teamId?:string):Promise<CalendarMeetingDetail|null>{
 if(!validCalendarMeetingRef(kind,id))return null;
 const source=tables[kind],alias=source.alias;
 const columnList=await db.query<{column_name:string}>(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name=$1`,[source.table]);
 const present=new Set(columnList.rows.map(r=>r.column_name));
 if(!["id","sprint_id","starts_at","ends_at",source.nameColumn].every(x=>present.has(x)))return null;
 const status=present.has(source.statusColumn)?`COALESCE(${alias}.${source.statusColumn},'unknown')`:"'unknown'::text";
 const explicit=present.has("status_explicit")?`${alias}.status_explicit`:"NULL::boolean";
 const generation=present.has("generation_source")?`${alias}.generation_source`:"NULL::text";
 const actual=present.has("actual_minutes")?`${alias}.actual_minutes`:"NULL::integer";
 const revision=present.has("revision")?`${alias}.revision`:"1::integer";
 const title=kind==="ceremony"?"(s.name||' — '||c.kind)":`${alias}.name`;
 const planned=kind==="ceremony"&&present.has("minutes")?"c.minutes":
  kind==="exceptional"&&present.has("duration_minutes")?"m.duration_minutes":
  `round((EXTRACT(EPOCH FROM (${alias}.ends_at-${alias}.starts_at))/60)::numeric)::integer`;
 const kindColumn=kind==="ceremony"?"c.kind":"NULL::text";
 const res=await db.query<Row>(`
  SELECT ${alias}.id,${title} AS name,${alias}.starts_at::text AS start_at,
    ${alias}.ends_at::text AS end_at,${status} AS status,
    ${explicit} AS status_explicit,${generation} AS generation_source,
    ${planned} AS planned_minutes,${actual} AS actual_minutes,${revision} AS revision,
    ${kindColumn} AS ceremony_kind,s.id AS sprint_id,s.name AS sprint_name,
    s.status AS sprint_status,s.time_zone
  FROM public.${source.table} ${alias}
  JOIN public.smn_sprint s ON s.id=${alias}.sprint_id
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE i.id='singleton' AND i.state='initialized' AND (lower(i.mode)='scrum' OR i.schema_version=29)
   AND s.deleted_at IS NULL AND ${alias}.id=$1
   AND ($2::text IS NULL OR (i.schema_version IN (28,29) AND s.team_id=$2))
   AND (i.schema_version<=27 OR (i.schema_version IN (28,29) AND $2::text IS NOT NULL))
   LIMIT 1`,[id,teamId??null]);
 const item=res.rows[0];
 if(!item)return null;
 return {
  id:item.id,kind,name:item.name,sprintId:item.sprint_id,sprintName:item.sprint_name,
  sprintStatus:item.sprint_status,startAt:item.start_at,endAt:item.end_at,
  timeZone:item.time_zone,status:item.status,statusExplicit:item.status_explicit,
  generationSource:item.generation_source,plannedMinutes:Number(item.planned_minutes),
  actualMinutes:item.actual_minutes,revision:item.revision,ceremonyKind:item.ceremony_kind
 };
}
