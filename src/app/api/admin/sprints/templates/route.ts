import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {listTemplates,saveTemplate} from "@/server/sprints/ceremony-templates";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({templates:await withLegacyTeamApi(listTemplates)});}catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>saveTemplate(db,actor.id,body));return jsonResult(result,result.ok?200:result.error==="conflict"?409:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
