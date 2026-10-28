import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {mapLinkError} from "@/server/links/validation";
import {reassignCategory} from "@/server/links/categories-admin";
export const runtime="nodejs";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,1024);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const {id}=await params;
  return jsonResult(await withAuthDb(db=>reassignCategory(db,actor,id,body.targetId as string)));
 }catch(error){const mapped=mapLinkError(error);return jsonResult({error:mapped.error},mapped.status);}
}
