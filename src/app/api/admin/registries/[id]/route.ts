import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readRegistryItem,updateRegistryItem} from "@/server/registries/items";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const item=await withSprintIndexDb(db=>readRegistryItem(db,id));
  if(item&&actor.role!=="admin"){
   const {owner,comment,revision,createdAt,updatedAt,...collective}=item;
   return jsonResult({item:collective});
  }
  return jsonResult(item?{item}:{error:"not-found"},item?200:404);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body||!Number.isSafeInteger(body.revision))return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 const {revision,...input}=body;
 try{
  const result=await withAuthDb(db=>updateRegistryItem(db,actor.id,id,revision as number,input));
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
