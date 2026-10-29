import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {kanbanCadenceProposal,confirmKanbanCadenceProposal} from "@/server/kanban/cadence-change.server";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(db=>kanbanCadenceProposal(db,actor.id,request.nextUrl.searchParams.get("teamId"))));}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input||Object.keys(input).some(k=>!["cadenceRevision","proposalToken","teamId"].includes(k))||
   (input.teamId!==undefined&&typeof input.teamId!=="string"))return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>confirmKanbanCadenceProposal(db,actor.id,input.cadenceRevision,input.proposalToken,typeof input.teamId==="string"?input.teamId:null));
  return result.ok?jsonResult(result):jsonResult(result,result.error==="invalid-input"?400:409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
