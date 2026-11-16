import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {freeCatalogSnapshot} from "@/server/ai-connections/free-catalog";
export const dynamic="force-dynamic";
export const runtime="nodejs";
/** Read only: never imports or reclassifies remote models as free. */
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 return jsonResult(freeCatalogSnapshot());
}
