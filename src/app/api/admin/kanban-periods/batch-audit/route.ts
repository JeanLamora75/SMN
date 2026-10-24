import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {ensureKanbanPeriodTables} from "@/server/kanban/periods";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",{type:"audit",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{
  return jsonResult(await withAuthDb(async db=>{
   await ensureKanbanPeriodTables(db);
   const table=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_kanban_batch_audit') IS NOT NULL AS exists`);
   if(!table.rows[0]?.exists)return {batches:[]};
   const result=await db.query(`SELECT a.id,a.team_id AS "teamId",a.actor_id AS "actorId",
    a.created_at::text AS "createdAt",a.cadence,a.quantity,a.cadence_revision AS "cadenceRevision",a.periods
    FROM public.smn_kanban_batch_audit a JOIN public.smn_team t ON t.id=a.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND lower(i.mode)='kanban'
    ORDER BY a.created_at DESC LIMIT 100`);
   return {batches:result.rows};
  }));
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
