import type {Client} from "pg";
import type {TeamContextRow} from "@/server/teams/resolve";
import {registryTypes,registryStatuses,type RegistryType} from "@/lib/registry-types";

export type RegistryScope="all"|RegistryType;
export type RegistryLifecycle="all"|"followup"|"final";
export type RegistrySort="default"|"dateDesc"|"dateAsc"|"titleAsc"|"titleDesc";
export type RegistryFilters={
 type:RegistryScope;search:string;status:string;owner:string;page:number;
 lifecycle:RegistryLifecycle;sort:RegistrySort;cycleId:string;
};

// Only known business terminal statuses are final. A recorded highlight is neither
// active nor final until its categorisation receives a separate business decision.
const followupSql="((r.type='risk' AND r.status='open') OR (r.type='obstacle' AND r.status IN ('open','in_progress')) OR (r.type='dependency' AND r.status IN ('open','in_progress')) OR (r.type='decision' AND r.status='active') OR (r.type='action' AND r.status IN ('todo','in_progress')))";
const finalSql="((r.type='risk' AND r.status='resolved') OR (r.type='obstacle' AND r.status IN ('resolved','abandoned')) OR (r.type='dependency' AND r.status IN ('satisfied','cancelled')) OR (r.type='decision' AND r.status IN ('replaced','cancelled')) OR (r.type='action' AND r.status IN ('completed','cancelled')))";

export function registryLifecycle(type:string,status:string):"followup"|"final"|"unclassified"{
 if(type==="highlight"&&status==="recorded")return "unclassified";
 const active:Record<string,readonly string[]>={
  risk:["open"],obstacle:["open","in_progress"],dependency:["open","in_progress"],
  decision:["active"],action:["todo","in_progress"]
 };
 const final:Record<string,readonly string[]>={
  risk:["resolved"],obstacle:["resolved","abandoned"],
  dependency:["satisfied","cancelled"],decision:["replaced","cancelled"],
  action:["completed","cancelled"]
 };
 if(active[type]?.includes(status))return "followup";
 if(final[type]?.includes(status))return "final";
 return "unclassified";
}
const uuidRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseRegistryFilters(params:URLSearchParams):RegistryFilters|null{
 const type=params.get("type")??"all",search=(params.get("search")??"").trim(),
  status=params.get("status")??"",owner=(params.get("owner")??"").trim(),
  lifecycle=params.get("lifecycle")??"all",sort=params.get("sort")??"default",
  cycleId=params.get("cycleId")??"",page=Number(params.get("page")??"1");
 const types=type==="all"?registryTypes:registryTypes.filter(t=>t===type);
 if(types.length===0||search.length>120||owner.length>200||
  !Number.isSafeInteger(page)||page<1||page>100000||
  !["all","followup","final"].includes(lifecycle)||
  !["default","dateDesc","dateAsc","titleAsc","titleDesc"].includes(sort)||
  (cycleId!==""&&!uuidRx.test(cycleId))||
  (status!==""&&!types.some(t=>(registryStatuses[t] as readonly string[]).includes(status))))return null;
 return {type:type as RegistryScope,search,status,owner,page,
  lifecycle:lifecycle as RegistryLifecycle,sort:sort as RegistrySort,cycleId};
}

async function installedTeam(db:Client,authorizedTeam?:TeamContextRow){
 if(authorizedTeam)return {id:authorizedTeam.team_id,name:authorizedTeam.team,mode:authorizedTeam.mode};
 const team=await db.query<{id:string;name:string;mode:string}>(
  "SELECT t.id,t.name,lower(i.mode) AS mode FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban') LIMIT 2");
 return team.rows.length===1?team.rows[0]:null;
}
export async function readRegistryCycles(db:Client,authorizedTeam?:TeamContextRow){
 const team=await installedTeam(db,authorizedTeam);
 if(!team)return {state:"unavailable" as const,reason:"team-unavailable" as const};
 const kanban=team.mode==="kanban";
 const source=kanban?"smn_kanban_period":"smn_sprint";
 const exists=await db.query<{present:boolean}>("SELECT to_regclass('public."+source+"') IS NOT NULL AS present");
 if(!exists.rows[0]?.present)return {state:"unavailable" as const,reason:"cycles-not-installed" as const};
 const cycles=await db.query<{id:string;name:string;status:string}>(
  kanban
   ?"SELECT p.id,p.name,p.status FROM public.smn_kanban_period p WHERE p.team_id=$1 AND p.deleted_at IS NULL ORDER BY p.start_on DESC,p.id DESC"
   :"SELECT s.id,s.name,s.status FROM public.smn_sprint s WHERE s.team_id=$1 AND s.deleted_at IS NULL ORDER BY s.start_at DESC,s.id DESC",
  [team.id]);
 return {state:"available" as const,cycles:cycles.rows};
}

export async function readRegistryPage(db:Client,filters:RegistryFilters,canSeeOwner:boolean,
 authorizedTeam?:TeamContextRow){
 // A missing source must not be represented as an empty register.
 const installed=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS present");
 if(!installed.rows[0]?.present)return {state:"unavailable" as const,reason:"not-installed" as const};
 const team=await installedTeam(db,authorizedTeam);
 if(!team)return {state:"unavailable" as const,reason:"team-unavailable" as const};
 if(filters.owner&&!canSeeOwner)return {state:"forbidden" as const};
 if(filters.cycleId){
  const table=team.mode==="kanban"?"smn_kanban_registry_link":"smn_registry_cycle_link";
  const links=await db.query<{present:boolean}>("SELECT to_regclass('public."+table+"') IS NOT NULL AS present");
  if(!links.rows[0]?.present)return {state:"unavailable" as const,reason:"links-not-installed" as const};
 }
 const values=[team.id,filters.type,"%"+filters.search+"%",filters.status,"%"+filters.owner+"%",filters.lifecycle];
 const clauses=[
  "r.team_id=$1",
  "($2='all' OR r.type=$2)",
  "($3='%%' OR r.title ILIKE $3 OR COALESCE(r.description,'') ILIKE $3)",
  "($4='' OR r.status=$4)",
  "($5='%%' OR COALESCE(r.owner_name,'') ILIKE $5)",
  "($6='all' OR ($6='followup' AND "+followupSql+") OR ($6='final' AND "+finalSql+"))"
 ];
 if(filters.cycleId){
  values.push(filters.cycleId);
  clauses.push(team.mode==="kanban"
   ?"EXISTS (SELECT 1 FROM public.smn_kanban_registry_link l JOIN public.smn_kanban_period p ON p.id=l.period_id WHERE l.item_id=r.id AND p.id=$7 AND p.team_id=r.team_id AND p.deleted_at IS NULL)"
   :"EXISTS (SELECT 1 FROM public.smn_registry_cycle_link l JOIN public.smn_sprint s ON s.id=l.sprint_id WHERE l.item_id=r.id AND s.id=$7 AND s.team_id=r.team_id AND s.deleted_at IS NULL)");
 }
 const where=clauses.join(" AND ");
 const count=await db.query<{total:number}>("SELECT COUNT(*)::int AS total FROM public.smn_registry_item r WHERE "+where,values);
 const total=count.rows[0]?.total??0,pageSize=25,totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(filters.page,totalPages);
 const orders:Record<RegistrySort,string>={
  default:"CASE WHEN "+followupSql+" THEN 0 WHEN "+finalSql+" THEN 2 ELSE 1 END ASC, r.occurred_on DESC,r.created_at DESC,r.id ASC",
  dateDesc:"r.occurred_on DESC,r.created_at DESC,r.id ASC",
  dateAsc:"r.occurred_on ASC,r.created_at ASC,r.id ASC",
  titleAsc:"r.title ASC,r.occurred_on DESC,r.id ASC",
  titleDesc:"r.title DESC,r.occurred_on DESC,r.id ASC"
 };
 const rows=await db.query("SELECT r.id,r.type,r.title,r.description,r.status,r.occurred_on::text AS \"occurredOn\",r.due_on::text AS \"dueOn\",r.created_at::text AS \"recordedAt\""+
  (canSeeOwner?',r.owner_name AS "owner"':"")+
  " FROM public.smn_registry_item r WHERE "+where+" ORDER BY "+orders[filters.sort]+" LIMIT 25 OFFSET $"+(values.length+1),
  [...values,(page-1)*pageSize]);
 return {state:"available" as const,team,items:rows.rows,total,page,pageSize,totalPages,
  filters:{...filters,owner:canSeeOwner?filters.owner:""}};
}
