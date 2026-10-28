import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {transferAdminLink} from "@/server/links/admin-transfer";
import {mapLinkError} from "@/server/links/validation";
export const runtime="nodejs";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,2048);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const {id}=await params;
  const result=await withAuthDb(db=>transferAdminLink(db,actor,id,{
   scope:body.scope as "TRANSVERSE"|"EQUIPE",teamId:body.teamId as string|null,revision:body.revision as number
  }));
  return jsonResult({item:result});
 }catch(error){const result=mapLinkError(error);return jsonResult({error:result.error},result.status);}
}
