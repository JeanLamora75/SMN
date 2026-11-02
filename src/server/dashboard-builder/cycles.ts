import type {Client} from "pg";
import type {LayoutScope} from "./layout";
import {requireDashboardPermission} from "./permissions";

export type DashboardCycle=Readonly<{id:string;name:string;status:string;startAt:string;endAt:string}>;
const valid=(s:string)=>/^[A-Za-z0-9_-]{1,100}$/.test(s);
/** Business-owned cycle facts: read only, scoped to the authorized installation and team. */
export async function listDashboardCycles(db:Client,scope:LayoutScope,mode:"scrum"|"kanban"):Promise<DashboardCycle[]>{
 await requireDashboardPermission(db,scope,"read");
 if(!valid(scope.teamId)||!["scrum","kanban"].includes(mode))throw Error("dashboard-cycle-invalid");
 const table=mode==="scrum"?"smn_sprint":"smn_kanban_period";
 const start=mode==="scrum"?"start_at":"start_on";
 const end=mode==="scrum"?"end_at":"end_on";
 const rows=await db.query<{id:string;name:string;status:string;start_at:string;end_at:string}>(`
 SELECT c.id,c.name,c.status,c.${start}::text AS start_at,c.${end}::text AS end_at
 FROM public.${table} c
 JOIN public.smn_team t ON t.id=c.team_id AND t.installation_id=$2
 WHERE c.team_id=$1 AND c.deleted_at IS NULL
 ORDER BY c.${start} ASC,c.id ASC`,[scope.teamId,scope.installationId]);
 return rows.rows.map(r=>({id:r.id,name:r.name,status:r.status,startAt:r.start_at,endAt:r.end_at}));
}
export function cycleNavigation(cycles:readonly DashboardCycle[],requested:string|null){
 if(requested&&!cycles.some(c=>c.id===requested))throw Error("dashboard-cycle-out-of-team");
 const current=cycles.findIndex(c=>c.id===(requested??cycles.at(-1)?.id));
 return {current:current<0?null:cycles[current],
  previous:current>0?cycles[current-1].id:null,
  next:current>=0&&current<cycles.length-1?cycles[current+1].id:null};
}
