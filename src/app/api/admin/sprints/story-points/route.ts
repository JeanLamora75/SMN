import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readStoryPoints,writeStoryPoints} from "@/server/sprints/story-points";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 const id=req.nextUrl.searchParams.get("sprintId");if(!id)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>readStoryPoints(db,id));return jsonResult(r??{error:"not-found"},r?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>writeStoryPoints(db,actor.id,body));
 return jsonResult(r,r.ok?200:r.error==="closed-period"||r.error==="conflict"?409:r.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
