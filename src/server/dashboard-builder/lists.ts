import type {Client} from "pg";
import type {LayoutScope} from "./layout";
import type {BatchRequest} from "./batch";
export type DashboardListItem={id:string;label:string;status:string;kind:string;href:string;date:string|null};
export type DashboardListPayload={rows:DashboardListItem[];total:number;nextOffset:number|null};
export function listFilters(filters:Record<string,unknown>|undefined){
 const limit=filters?.limit===undefined?10:Number(filters.limit);
 const offset=filters?.offset===undefined?0:Number(filters.offset);
 const sort=filters?.sort==="asc"?"asc":"desc";
 const showClosed=filters?.showClosed===true;
 const type=typeof filters?.type==="string"?filters.type:"all";
 if(!Number.isSafeInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(offset)||offset<0||offset>10000||
 !["all","risk","obstacle","dependency","highlight","decision","action"].includes(type))throw Error("dashboard-list-filters-invalid");
 return {limit,offset,sort,showClosed,type};
}
const finalSql=`((r.type='risk' AND r.status='resolved') OR
 (r.type='obstacle' AND r.status IN ('resolved','abandoned')) OR
 (r.type='dependency' AND r.status IN ('satisfied','cancelled')) OR
 (r.type='decision' AND r.status IN ('replaced','cancelled')) OR
 (r.type='action' AND r.status IN ('completed','cancelled')))`;
/** Authoritative registry tables, scoped by team and optionally linked cycle. No Dashboard mutations. */
export async function readRegistryDashboardList(db:Client,scope:LayoutScope,request:BatchRequest):Promise<DashboardListPayload>{
 const f=listFilters(request.filters);
 const link=await db.query<{mode:string}>(`
 SELECT COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode) AS mode
 FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id=$1 AND t.id=$2`,[scope.installationId,scope.teamId]);
 if(link.rows.length!==1)throw Error("dashboard-list-team-invalid");
 const mode=link.rows[0].mode;
 const cycleId=request.cycleId;
 const linkTable=mode==="kanban"?"smn_kanban_registry_link":"smn_registry_cycle_link";
 const cycleTable=mode==="kanban"?"smn_kanban_period":"smn_sprint";
 const cycleColumn=mode==="kanban"?"period_id":"sprint_id";
 const filters=[scope.teamId,f.type,f.showClosed,cycleId??null] as unknown[];
 const where=`r.team_id=$1 AND (($2='all' AND r.type IN ('risk','obstacle','dependency')) OR r.type=$2)
 AND ($3::boolean OR NOT ${finalSql})
 AND ($4::text IS NULL OR EXISTS (SELECT 1 FROM public.${linkTable} l
 JOIN public.${cycleTable} c ON c.id=l.${cycleColumn}
 WHERE l.item_id=r.id AND c.id=$4 AND c.team_id=r.team_id AND c.deleted_at IS NULL))`;
 const count=await db.query<{total:number}>(`SELECT count(*)::int AS total FROM public.smn_registry_item r WHERE ${where}`,filters);
 const result=await db.query<{id:string;title:string;status:string;type:string;date:string|null}>(`
 SELECT r.id,r.title,r.status,r.type,r.occurred_on::text AS date
 FROM public.smn_registry_item r WHERE ${where}
 ORDER BY r.occurred_on ${f.sort==="asc"?"ASC":"DESC"},r.created_at ${f.sort==="asc"?"ASC":"DESC"},r.id ASC
 LIMIT $5 OFFSET $6`,[...filters,f.limit,f.offset]);
 const total=count.rows[0]?.total??0;
 return {rows:result.rows.map(r=>({id:r.id,label:r.title,status:r.status,kind:r.type,
  href:"/app/admin/registries/"+encodeURIComponent(r.id),date:r.date})),
 total,nextOffset:f.offset+result.rows.length<total?f.offset+result.rows.length:null};
}

/** Calendar events are read from the same authoritative projection as the legacy dashboard. */
export async function readCalendarDashboardList(db:Client,scope:LayoutScope,request:BatchRequest):Promise<DashboardListPayload>{
 if(!request.cycleId)return {rows:[],total:0,nextOffset:null};
 const allowed=await db.query<{id:string;status:string}>(`
 SELECT s.id,s.status FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id AND t.installation_id=$2
 WHERE s.id=$1 AND s.team_id=$3 AND s.deleted_at IS NULL`,[request.cycleId,scope.installationId,scope.teamId]);
 if(allowed.rows.length!==1)throw Error("dashboard-cycle-out-of-team");
 const {readCurrentSprintEvents}=await import("../dashboard/events-reader");
 const data=await readCurrentSprintEvents(db,request.cycleId,new Date(),allowed.rows[0].status==="closed");
 if(data.state!=="available")throw Error("dashboard-calendar-unavailable");
 const f=listFilters(request.filters);
 const rows=data.items.map(item=>({id:item.id,label:item.title,status:item.status,kind:item.kind,
  href:"/app/team-calendar",date:item.startsAt}));
 const ordered=f.sort==="asc"?[...rows].reverse():rows;
 return {rows:ordered.slice(f.offset,f.offset+f.limit),total:data.total,
  nextOffset:f.offset+f.limit<data.total?f.offset+f.limit:null};
}
/** Notes retain sprint/team ownership; alerts come from the same existing read-only projector. */
export async function readNotesDashboardList(db:Client,scope:LayoutScope,request:BatchRequest):Promise<DashboardListPayload>{
 if(!request.cycleId)return {rows:[],total:0,nextOffset:null};
 const allowed=await db.query<{id:string}>(`
 SELECT s.id FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id AND t.installation_id=$2
 WHERE s.id=$1 AND s.team_id=$3 AND s.deleted_at IS NULL`,[request.cycleId,scope.installationId,scope.teamId]);
 if(allowed.rows.length!==1)throw Error("dashboard-cycle-out-of-team");
 const {readCycleNotesAndAlerts}=await import("../dashboard/attention-reader");
 const data=await readCycleNotesAndAlerts(db,scope.teamId,request.cycleId);
 if(data.state!=="available")throw Error("dashboard-notes-unavailable");
 const f=listFilters(request.filters);
 const rows=data.items.map(item=>({id:item.id,label:item.title,status:item.status,kind:item.kind,
  href:"/app?"+new URLSearchParams({teamId:scope.teamId,cycleId:request.cycleId!}).toString(),date:null}));
 return {rows:rows.slice(f.offset,f.offset+f.limit),total:data.total,
  nextOffset:f.offset+f.limit<data.total?f.offset+f.limit:null};
}
