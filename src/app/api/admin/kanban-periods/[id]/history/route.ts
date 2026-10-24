import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {ensureKanbanPeriodTables} from "@/server/kanban/periods";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{return jsonResult(await withAuthDb(async db=>{
  await ensureKanbanPeriodTables(db);
  const accessible=await db.query(`SELECT 1 FROM public.smn_kanban_period p
   JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE p.id=$1 AND i.id='singleton' AND lower(i.mode)='kanban'`,[id]);
  if(!accessible.rowCount)return {history:[]};
  const result=await db.query<{id:string;action:string;details:Record<string,unknown>;actor_id:string|null;created_at:string}>(`
   SELECT id,action,details,actor_id,created_at::text FROM public.smn_kanban_period_audit
   WHERE period_id=$1 AND action IN ('dates-corrected','cadence-rescheduled')
   ORDER BY created_at DESC,id DESC LIMIT 100`,[id]);
  return {history:result.rows.map(x=>({id:x.id,action:x.action,details:x.details,actorId:x.actor_id,createdAt:x.created_at}))};
 }));}catch{return jsonResult({error:"service-unavailable"},503);}
}
