import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {readCadence,updateCadence} from "@/server/sprints/cadence";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(async db=>{
  const selected=req.nextUrl.searchParams.get("teamId");
  const cadence=await readCadence(db,{accountId:actor.id,role:actor.role},selected);
  return {cadence,teamId:selected};
 }));}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const {teamId,...values}=body;
  if(teamId!==undefined&&typeof teamId!=="string")return jsonResult({error:"invalid-input"},400);
  const result=await withAuthDb(db=>updateCadence(db,actor.id,values,teamId as string|undefined));
  if(!result.ok)return jsonResult({error:result.error},result.error==="conflict"?409:400);
  return jsonResult({cadence:result.cadence,changed:result.changed});
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
