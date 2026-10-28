import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {readCapacitySynchronization} from "@/server/capacity/synchronization";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"companies",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(k=>!["teamId","start","end"].includes(k))||
  ["teamId","start","end"].some(k=>params.getAll(k).length!==1))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},params.get("teamId"));
   return readCapacitySynchronization(db,team.team_id,params.get("start")??"",params.get("end")??"");
  });
  return jsonResult({synchronization:result});
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
