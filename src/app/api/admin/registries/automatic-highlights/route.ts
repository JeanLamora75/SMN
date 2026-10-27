import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readAutomaticHighlightSettings,saveAutomaticHighlightSettings} from "@/server/registries/automatic-highlights";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withLegacyRegistryReadDb(readAutomaticHighlightSettings));}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const data=await readJsonObject(req);if(!data)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>saveAutomaticHighlightSettings(db,actor.id,data));
 return jsonResult(result,result.ok?200:result.error==="conflict"?409:400);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
