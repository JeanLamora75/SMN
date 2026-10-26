import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {ensureKanbanPeriodTables} from "@/server/kanban/periods";
import {resolveAdminTeam} from "@/server/teams/resolve";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"collective",exists:true,inScope:true} as const;
/** Read-only sprint periods for any authorized calendar viewer. */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(k=>k!=="teamId")||params.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withAuthDb(async db=>{
   const mode=await db.query<{mode:string;schema_version:number}>(
    "SELECT mode,schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   if(mode.rows[0]?.schema_version===28){
    if(actor.role!=="admin")throw Error("calendar-periods-team-forbidden");
    const team=await resolveAdminTeam(db,
     {accountId:actor.id,role:actor.role},params.get("teamId"));
    if(team.mode==="kanban"){
     const exists=await db.query<{present:boolean}>(
      "SELECT to_regclass('public.smn_kanban_period') IS NOT NULL AS present");
     if(!exists.rows[0]?.present)return {mode:"kanban",sprints:[]};
     const rows=await db.query<{id:string;name:string;status:string;start_on:string;end_on:string}>(`
      SELECT p.id,p.name,p.status,p.start_on::text,p.end_on::text
      FROM public.smn_kanban_period p
      JOIN public.smn_team t ON t.id=p.team_id
      WHERE p.team_id=$1 AND t.installation_id='singleton'
       AND p.deleted_at IS NULL ORDER BY p.start_on DESC LIMIT 100`,[team.team_id]);
     return {mode:"kanban",sprints:rows.rows.map(p=>({
      id:p.id,name:p.name,status:p.status,
      startAt:p.start_on+"T00:00:00.000Z",endAt:p.end_on+"T23:59:59.999Z"
     }))};
    }
    const rows=await db.query<{id:string;name:string;status:string;start_at:string;end_at:string}>(`
     SELECT s.id,s.name,s.status,s.start_at::text,s.end_at::text
     FROM public.smn_sprint s
     JOIN public.smn_team t ON t.id=s.team_id
     WHERE s.team_id=$1 AND t.installation_id='singleton'
       AND s.deleted_at IS NULL ORDER BY s.start_at DESC LIMIT 100`,[team.team_id]);
    return {mode:"scrum",sprints:rows.rows.map(s=>({
     id:s.id,name:s.name,status:s.status,startAt:s.start_at,endAt:s.end_at
    }))};
   }
   if(typeof mode.rows[0]?.schema_version!=="number"||
      mode.rows[0].schema_version>27||mode.rows[0].schema_version<1)
    throw Error("calendar-periods-schema-incompatible");
   const legacy=mode;
   if(legacy.rows[0]?.mode==="kanban"){
    await ensureKanbanPeriodTables(db);
    const rows=await db.query<{id:string;name:string;status:string;start_on:string;end_on:string}>(`
     SELECT p.id,p.name,p.status,p.start_on::text,p.end_on::text
     FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
     JOIN public.smn_installation i ON i.id=t.installation_id
     WHERE i.id='singleton' AND lower(i.mode)='kanban' AND p.deleted_at IS NULL
     ORDER BY p.start_on DESC LIMIT 100`);
    return {mode:"kanban",sprints:rows.rows.map(p=>({id:p.id,name:p.name,status:p.status,
     startAt:p.start_on+"T00:00:00.000Z",endAt:p.end_on+"T23:59:59.999Z"}))};
   }
   const r=await db.query<{id:string;name:string;status:string;start_at:string;end_at:string}>(`
    SELECT s.id,s.name,s.status,s.start_at::text,s.end_at::text
    FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
     JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL AND lower(i.mode)='scrum'
    ORDER BY s.start_at DESC LIMIT 100`);
   return {mode:"scrum",sprints:r.rows.map(x=>({id:x.id,name:x.name,status:x.status,startAt:x.start_at,endAt:x.end_at}))};
  }));
 }catch{
  console.error("team-calendar-periods-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
