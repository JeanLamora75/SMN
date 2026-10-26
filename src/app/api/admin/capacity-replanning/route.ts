import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {previewReplanning,confirmReplanning,parseReplanning} from "@/server/capacity/replanning";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))
  return jsonResult({error:"forbidden"},403);
 const query=request.nextUrl.searchParams;
 const params=Object.fromEntries(query.entries());
 if(query.size!==4||!parseReplanning(params))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>previewReplanning(db,params));
  if(!result.ok)return jsonResult({error:result.error,
   references:"not-calculable",saved:false},
   result.error==="period-not-found"?404:
   result.error==="team-unavailable"?503:result.error==="invalid-input"?400:503);
  return jsonResult({...result,saved:false});
 }catch{
  console.error("capacity-replanning-preview-unavailable");
  return jsonResult({error:"calculation-error",references:"not-calculable",saved:false},503);
 }
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input",saved:false},400);
 try{
  const result=await withLegacyTeamApi(db=>confirmReplanning(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error,saved:false},
   result.error==="closed"?423:
   result.error==="conflict"||result.error==="target-in-use"?409:
   result.error==="period-not-found"?404:
   result.error==="not-calculable"?422:
   result.error==="team-unavailable"||result.error==="calculation-error"?503:400);
  return jsonResult({...result,saved:true});
 }catch{
  console.error("capacity-replanning-confirmation-unavailable");
  return jsonResult({error:"service-unavailable",saved:false},503);
 }
}
