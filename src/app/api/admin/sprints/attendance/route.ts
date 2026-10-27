import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {listAttendance,qualifyAttendance,attendanceHistory} from "@/server/sprints/attendance";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 const kind=req.nextUrl.searchParams.get("kind"),id=req.nextUrl.searchParams.get("id");
 try{
  if(kind&&id){if(!["standard","custom","exceptional"].includes(kind))return jsonResult({error:"invalid-input"},400);
   return jsonResult({history:await withLegacyTeamApi(db=>attendanceHistory(db,kind as "standard"|"custom"|"exceptional",id))});}
  return jsonResult({events:await withLegacyTeamApi(listAttendance)});
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>qualifyAttendance(db,actor.id,body));
 return jsonResult(r,r.ok?200:r.error==="not-found"?404:r.error==="not-yet-due"?409:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
