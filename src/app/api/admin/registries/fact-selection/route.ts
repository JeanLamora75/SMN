import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readSelectableFacts,updateFactSelection} from "@/server/registries/fact-selection";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({items:await withLegacyRegistryReadDb(readSelectableFacts)});}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>updateFactSelection(db,actor.id,body));
 return jsonResult(result,result.ok?200:result.error==="conflict"?409:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
