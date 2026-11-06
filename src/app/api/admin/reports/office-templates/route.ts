import type {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {listOfficeTemplates} from "@/server/reports/office-catalog";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const scope={type:"settings",exists:true,inScope:true} as const;

export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",scope);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId){
  try{
   await withAuthDb(db=>resolveAdminTeam(db,{accountId:actor.id,role:actor.role},teamId));
  }catch{return jsonResult({error:"forbidden"},403);}
 }
 try{
  const templates=await listOfficeTemplates();
  return jsonResult({templates});
 }catch{
  return jsonResult({error:"unavailable"},503);
 }
}
