import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult} from "@/server/auth/request";
import {readKanbanPeriodReport} from "@/server/kanban/report";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const report=await withLegacyTeamApi(db=>readKanbanPeriodReport(db,id));
  return report?jsonResult(report):jsonResult({error:"not-found"},404);
 }catch{console.error("kanban-report-read-failed");return jsonResult({error:"service-unavailable"},503);}
}
