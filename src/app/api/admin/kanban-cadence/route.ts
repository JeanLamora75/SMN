import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {readKanbanCadence,updateKanbanCadence} from "@/server/kanban/cadence";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult({cadence:await withAuthDb(db=>readKanbanCadence(db,{accountId:actor.id,role:actor.role},req.nextUrl.searchParams.get("teamId")))});}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {teamId,...cadence}=body;
 if(teamId!==undefined&&typeof teamId!=="string")return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>updateKanbanCadence(db,{accountId:actor.id,role:actor.role},cadence,typeof teamId==="string"?teamId:null));
  if(!result.ok)return jsonResult({error:result.error},result.error==="conflict"?409:400);
  return jsonResult({cadence:result.cadence,changed:result.changed});
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
