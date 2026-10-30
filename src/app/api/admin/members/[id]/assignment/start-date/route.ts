import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {correctAssignmentStart} from "@/server/members/assignment-start-correction";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"members",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const teamId=body.teamId;
  if(teamId!==undefined&&(typeof teamId!=="string"||actor.role!=="admin"))return jsonResult({error:"forbidden"},403);
  const input=teamId===undefined?body:{assignmentId:body.assignmentId,newStartOn:body.newStartOn,revision:body.revision};
  const result=teamId===undefined?
   await withLegacyMemberApi(db=>correctAssignmentStart(db,id,actor.id,input)):
   await withAuthDb(db=>correctAssignmentStart(db,id,actor.id,input,
    {actor:{accountId:actor.id,role:"admin"},teamId}));
  return jsonResult(result,result.ok?200:result.error==="not-found"?404:
    ["conflict","overlap","missing-version"].includes(result.error)?409:400);
 }catch(error){console.error("member-assignment-start-correction-failed",{
  message:error instanceof Error?error.message:String(error),
  code:typeof error==="object"&&error!==null&&"code" in error?String(error.code):undefined
 });return jsonResult({error:"service-unavailable"},503);}
}
