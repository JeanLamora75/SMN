import type {Client} from "pg";
import {
 collectionAvailable,collectionUnavailable,
 type CollectiveCycleProjection,type DashboardEvent
} from "@/lib/dashboard-data-contract";

type Events=CollectiveCycleProjection["events"];
type EventKind=DashboardEvent["kind"];
type SourceRow={
 id:string;kind:EventKind;title:string;starts_at:string|Date;ends_at:string|Date;
 status:string|null;generation_source:string|null
};
const TABLES=[
 {table:"smn_scrum_template_occurrence",kind:"template"},
 {table:"smn_sprint_ceremony",kind:"ceremony"},
 {table:"smn_sprint_exceptional_meeting",kind:"exceptional"}
] as const;

function obj(v:unknown):Record<string,unknown>|null{
 return typeof v==="object"&&v!==null&&!Array.isArray(v)?v as Record<string,unknown>:null;
}
function iso(v:unknown):string|null{
 if(typeof v!=="string"&&!(v instanceof Date))return null;
 const date=new Date(v);
 return Number.isFinite(date.getTime())?date.toISOString():null;
}
const kinds=new Set<EventKind>(["template","ceremony","exceptional"]);
function normalize(raw:unknown):DashboardEvent|null{
 const v=obj(raw);
 if(!v||typeof v.id!=="string"||!kinds.has(v.kind as EventKind)||
  typeof v.title!=="string"||!v.title.trim())return null;
 const startsAt=iso(v.starts_at),endsAt=iso(v.ends_at);
 if(!startsAt||!endsAt||startsAt>=endsAt)return null;
 const generation=v.generation_source;
 return {
  id:v.id,kind:v.kind as EventKind,title:v.title,
  startsAt,endsAt,
  status:typeof v.status==="string"&&v.status? v.status:"unknown",
  // Snapshot historique sans ce champ : provenance inconnue, jamais inventée.
  generationSource:generation==="reconstructed"?"reconstructed":
   generation==="standard"?"standard":null
 };
}
/** Pas de confusion entre une occurrence prévue, une occurrence tenue et une
 * occurrence reconstituée (qui n'atteste jamais de la tenue d'une réunion). */
export function classifyEventStatus(status:string):
 "scheduled"|"held"|"cancelled"|"unknown"{
 const s=status.toLowerCase();
 if(["done","held","completed","occurred","effective","realized"].includes(s))return "held";
 if(["cancelled","canceled"].includes(s))return "cancelled";
 if(["scheduled","planned"].includes(s))return "scheduled";
 return "unknown";
}
function sortEvents(items:readonly DashboardEvent[],now:Date,pastOnly:boolean){
 const stamp=now.getTime();
 return [...items].sort((a,b)=>{
  const aTime=Date.parse(a.startsAt),bTime=Date.parse(b.startsAt);
  if(!pastOnly){
   const aFuture=aTime>=stamp,bFuture=bTime>=stamp;
   if(aFuture!==bFuture)return aFuture?-1:1;
   if(aFuture)return aTime-bTime||a.id.localeCompare(b.id);
  }
  return bTime-aTime||a.id.localeCompare(b.id);
 });
}
/** Projection du document JSONB EXACT tel que figé à la clôture Vn. */
export function eventsFromClosureSnapshot(raw:unknown,version:number,now=new Date()):Events{
 const snapshot=obj(raw);
 if(!snapshot)return collectionUnavailable("read-failed");
 const mappings=[
  {key:"customMeetings",kind:"template" as EventKind},
  {key:"ceremonies",kind:"ceremony" as EventKind},
  {key:"exceptionalMeetings",kind:"exceptional" as EventKind}
 ];
 if(mappings.some(({key})=>!Array.isArray(snapshot[key])))
  return collectionUnavailable("history-missing");
 const items:DashboardEvent[]=[];
 for(const {key,kind} of mappings){
  for(const rawItem of snapshot[key] as unknown[]){
   const v=obj(rawItem);
   if(!v)return collectionUnavailable("read-failed");
   // La clôture sérialise la plupart des dates en snake_case.
   const event=normalize({
    id:v.id,kind,title:kind==="ceremony"?String(v.kind??"") :v.name,
    starts_at:v.starts_at,ends_at:v.ends_at,status:v.status,
    generation_source:v.generation_source
   });
   if(!event)return collectionUnavailable("read-failed");
   items.push(event);
  }
 }
 const order=sortEvents(items,now,true);
 return collectionAvailable(order.slice(0,5),order.length,{
  source:"closure-snapshot",snapshotVersion:version
 });
}

/**
 * Retourne le décompte exact et au maximum cinq événements du Sprint.
 * Aucune génération ni table créée lors de cette lecture.
 * Les sources facultatives absentes sont omises ; sans aucune source installée,
 * le résultat est indisponible, pas une liste prétendument vide.
 */
export async function readCurrentSprintEvents(db:Client,sprintId:string,
 now=new Date(),historical=false):Promise<Events>{
 const registered=await db.query<{table_name:string}>(`SELECT
  table_name FROM information_schema.tables
  WHERE table_schema='public' AND table_name=ANY($1::text[])`,
  [TABLES.map(t=>t.table)]);
 const existing=new Set(registered.rows.map(x=>x.table_name));
 const parts:string[]=[];
 if(existing.has("smn_scrum_template_occurrence")){
  parts.push(`SELECT id,'template'::text AS kind,name AS title,starts_at,ends_at,
    COALESCE(status,'unknown') AS status,generation_source
    FROM public.smn_scrum_template_occurrence WHERE sprint_id=$1`);
 }
 if(existing.has("smn_sprint_ceremony")){
  parts.push(`SELECT id,'ceremony'::text AS kind,kind AS title,starts_at,ends_at,
    'unknown'::text AS status,generation_source
    FROM public.smn_sprint_ceremony WHERE sprint_id=$1`);
 }
 if(existing.has("smn_sprint_exceptional_meeting")){
  parts.push(`SELECT id,'exceptional'::text AS kind,name AS title,starts_at,ends_at,
    COALESCE(status,'unknown') AS status,NULL::text AS generation_source
    FROM public.smn_sprint_exceptional_meeting WHERE sprint_id=$1`);
 }
 if(!parts.length)return collectionUnavailable("schema-missing");
 const union=parts.join(" UNION ALL ");
 const total=await db.query<{total:string}>(`SELECT count(*)::text AS total
  FROM (${union}) AS events`,[sprintId]);
 const count=Number(total.rows[0]?.total);
 if(!Number.isSafeInteger(count)||count<0)return collectionUnavailable("read-failed");
 // Règle UX : sur le Sprint actif/à venir : prochains événements d'abord,
 // puis les plus récents passés ; sur un Sprint passé : derniers événements.
 const order=historical?
  "starts_at DESC,id ASC":
  `CASE WHEN starts_at >= $2::timestamptz THEN 0 ELSE 1 END ASC,
   CASE WHEN starts_at >= $2::timestamptz THEN starts_at END ASC,
   CASE WHEN starts_at < $2::timestamptz THEN starts_at END DESC,id ASC`;
 const params=historical?[sprintId]:[sprintId,now.toISOString()];
 const rows=await db.query<SourceRow>(`SELECT * FROM (${union}) AS events
  ORDER BY ${order} LIMIT 5`,params);
 const items=rows.rows.map(normalize);
 if(items.some(item=>item===null))return collectionUnavailable("read-failed");
 return collectionAvailable(items as DashboardEvent[],count,{
  source:"recorded-events",snapshotVersion:null
 });
}
