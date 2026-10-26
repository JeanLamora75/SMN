import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {readKanbanPeriodContext} from "@/server/kanban/context";

export const dynamic="force-dynamic";
export const runtime="nodejs";

/** Lecture Kanban multiéquipes préparée : v28 et administrateur uniquement.
 * Le changement d'équipe demeure bloqué jusqu'aux tests d'isolation globaux.
 */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",
  {type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(k=>k!=="teamId")||params.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withSprintIndexDb(async db=>{
   const team=await resolveAdminTeam(db,
    {accountId:actor.id,role:actor.role},params.get("teamId"));
   if(team.mode!=="kanban")throw Error("kanban-mode-mismatch");
   return readKanbanPeriodContext(db,team.team_id);
  });
  return jsonResult(result);
 }catch{
  console.error("kanban-context-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
