import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {previewReschedule,confirmReschedule} from "@/server/sprints/reschedule";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest){
 if(!await authorizeApi(req,"write",target))return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);if(!input)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>previewReschedule(db,input));return jsonResult(r,r.ok?200:409);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);if(!input)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>confirmReschedule(db,actor.id,input));return jsonResult(r,r.ok?200:409);}
 catch{return jsonResult({error:"unavailable"},503);}
}
