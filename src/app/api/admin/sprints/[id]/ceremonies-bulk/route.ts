import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {changeSprintCeremonies,readSprintCeremonyTypeCounts,parseCeremonyDeleteTypes} from "@/server/sprints/ceremonies-bulk";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body||Object.keys(body).some(k=>!["teamId","operation","expectedCount","types","expectedSelectedCount"].includes(k))||
  typeof body.teamId!=="string"||
  !["create","delete"].includes(String(body.operation))||
  !Number.isSafeInteger(body.expectedCount)||Number(body.expectedCount)<0||
  (body.operation==="delete"&&!parseCeremonyDeleteTypes(body.types))||
  (body.operation==="create"&&(body.types!==undefined||body.expectedSelectedCount!==undefined))||
  (body.operation==="delete"&&(!Number.isSafeInteger(body.expectedSelectedCount)||Number(body.expectedSelectedCount)<1)))
  return jsonResult({error:"invalid-input"},400);
 const {id:sprintId}=await params;
 try{
  const result=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},body.teamId as string);
   if(team.team_id!==body.teamId||team.mode!=="scrum")
    return {ok:false as const,error:"not-found" as const};
   return changeSprintCeremonies(db,team.team_id,sprintId,
    body.operation as "create"|"delete",body.expectedCount as number,
    body.operation==="delete"?parseCeremonyDeleteTypes(body.types)!:undefined,
    body.operation==="delete"?body.expectedSelectedCount as number:undefined);
  });
  const status=result.ok?200:result.error==="not-found"?404:
   result.error==="invalid-input"?400:
   ["protected","state-changed","linked-data","no-templates"].includes(result.error)?409:503;
  return jsonResult(result,status);
 }catch{
  return jsonResult({error:"unavailable"},503);
 }
}

export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const query=req.nextUrl.searchParams;
 if(query.size!==1||query.getAll("teamId").length!==1||!query.get("teamId"))
  return jsonResult({error:"invalid-input"},400);
 const {id:sprintId}=await params;
 try{
  const result=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},query.get("teamId"));
   if(team.mode!=="scrum")return null;
   return readSprintCeremonyTypeCounts(db,team.team_id,sprintId);
  });
  if(!result)return jsonResult({error:"not-found"},404);
  return result.state==="available"?jsonResult(result):jsonResult({error:"incomplete-schema"},503);
 }catch{return jsonResult({error:"unavailable"},503);}
}
