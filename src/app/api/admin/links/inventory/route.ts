import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {mapLinkError} from "@/server/links/validation";
import {listAdminLinks,listAdminTeams} from "@/server/links/admin";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(async db=>({
  items:await listAdminLinks(db,actor),teams:await listAdminTeams(db,actor)
 })));}catch(error){const result=mapLinkError(error);return jsonResult({error:result.error},result.status);}
}
