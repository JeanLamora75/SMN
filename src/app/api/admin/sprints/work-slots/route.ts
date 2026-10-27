import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {getTeamSlots,saveTeamSlots} from "@/server/sprints/work-slot-config";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withLegacyTeamApi(getTeamSlots));}catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>saveTeamSlots(db,actor.id,body));return jsonResult(r,r.ok?200:409);}
 catch{return jsonResult({error:"unavailable"},503);}
}
