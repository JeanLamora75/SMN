import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {listCategories,mapLinkError} from "@/server/links/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult({items:await withAuthDb(db=>listCategories(db,actor))});}
 catch(error){const result=mapLinkError(error);return jsonResult({error:result.error},result.status);}
}
