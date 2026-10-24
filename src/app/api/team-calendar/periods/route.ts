import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {ensureKanbanPeriodTables} from "@/server/kanban/periods";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"collective",exists:true,inScope:true} as const;
/** Read-only sprint periods for any authorized calendar viewer. */
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 try{
  return jsonResult(await withAuthDb(async db=>{
   const mode=await db.query<{mode:string}>(`SELECT mode FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
   if(mode.rows[0]?.mode==="kanban"){
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
