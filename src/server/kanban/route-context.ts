import type {Client} from "pg";
import type {NextRequest} from "next/server";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import type {KanbanTeamAccess} from "@/server/kanban/scoped-period";

/** The API controls team scope; client teamId is never authorization. */
export async function withKanbanRouteTeam<T>(db:Client,request:NextRequest,
 actor:{id:string;role:"admin"|"user"},write:boolean,
 action:(access?:KanbanTeamAccess)=>Promise<T>):Promise<T>{
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(k=>k!=="teamId")||params.getAll("teamId").length>1)
  throw Error("invalid-input");
 const requested=params.get("teamId");
 const context=await resolveRegistryReadContext(db,
  {accountId:actor.id,role:actor.role},requested);
 if(context.version===28){
  if(write&&(!MULTI_TEAM_CONTEXT_READY||
     process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true"))
   throw Error("context-not-ready");
  if(!context.team||(requested&&context.team.team_id!==requested)||
     (write&&!requested))
   throw Error("team-access-forbidden");
  return action({actor:{accountId:actor.id,role:actor.role},teamId:context.team.team_id});
 }
 return action();
}
