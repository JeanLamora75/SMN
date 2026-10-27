import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {prepareKanbanPeriod,createKanbanPeriod} from "@/server/kanban/periods";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withLegacyTeamApi(prepareKanbanPeriod));}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>createKanbanPeriod(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},400);
  return jsonResult({period:result.period},201);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
