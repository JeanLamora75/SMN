import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {getTeamSlots,saveTeamSlots} from "@/server/sprints/work-slot-config";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(db=>getTeamSlots(db,{accountId:actor.id,role:actor.role},req.nextUrl.searchParams.get("teamId"))));}catch(error){console.error("smn-work-slots-read-unavailable",error instanceof Error?error.message:"unknown");return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const r=await withAuthDb(db=>saveTeamSlots(db,actor.id,body));return jsonResult(r,r.ok?200:r.error==="conflict"?409:400);}
 catch(error){console.error("smn-work-slots-save-unavailable",error instanceof Error?error.message:"unknown");return jsonResult({error:"unavailable"},503);}
}
