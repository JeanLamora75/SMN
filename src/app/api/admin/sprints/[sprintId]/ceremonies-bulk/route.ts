import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {changeSprintCeremonies} from "@/server/sprints/ceremonies-bulk";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest,{params}:{params:Promise<{sprintId:string}>}){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body||Object.keys(body).some(k=>!["teamId","operation","expectedCount"].includes(k))||
  typeof body.teamId!=="string"||
  !["create","delete"].includes(String(body.operation))||
  !Number.isSafeInteger(body.expectedCount)||Number(body.expectedCount)<0)
  return jsonResult({error:"invalid-input"},400);
 const {sprintId}=await params;
 try{
  const result=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},body.teamId as string);
   if(team.team_id!==body.teamId||team.mode!=="scrum")
    return {ok:false as const,error:"not-found" as const};
   return changeSprintCeremonies(db,team.team_id,sprintId,
    body.operation as "create"|"delete",body.expectedCount as number);
  });
  const status=result.ok?200:result.error==="not-found"?404:
   result.error==="invalid-input"?400:
   ["protected","state-changed","linked-data","no-templates"].includes(result.error)?409:503;
  return jsonResult(result,status);
 }catch{
  return jsonResult({error:"unavailable"},503);
 }
}
