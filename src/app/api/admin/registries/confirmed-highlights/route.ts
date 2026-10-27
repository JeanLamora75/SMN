import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult} from "@/server/auth/request";
import {readConfirmedHighlights} from "@/server/registries/confirmed-highlights";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({items:await withLegacyRegistryReadDb(readConfirmedHighlights)});}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
