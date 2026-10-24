import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {ensureKanbanPeriodTables} from "@/server/kanban/periods";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(async db=>{
  await ensureKanbanPeriodTables(db);
  const result=await db.query<{id:string;name:string;start_on:string;end_on:string;status:string}>(`SELECT p.id,p.name,p.start_on::text,p.end_on::text,p.status
   FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'
   ORDER BY p.start_on DESC,p.id DESC LIMIT 200`);
  return {periods:result.rows.map(p=>({id:p.id,name:p.name,startOn:p.start_on,endOn:p.end_on,status:p.status}))};
 }));}catch{return jsonResult({error:"service-unavailable"},503);}
}
