import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readDeadlineSettings,updateDeadlineSettings,readDeadlineAlerts} from "@/server/registries/deadlines";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{const data=await withAuthDb(async db=>{
  if(actor.role!=="admin")throw Error("team-access-forbidden");
  const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role});
  return readDeadlineAlerts(db,new Date().toISOString().slice(0,10),team.team_id);
 });return jsonResult(data);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(db=>updateDeadlineSettings(db,actor.id,body));
 return jsonResult(result,result.ok?200:result.error==="conflict"?409:400);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function OPTIONS(){return jsonResult({allowed:["GET","PATCH"]});}
