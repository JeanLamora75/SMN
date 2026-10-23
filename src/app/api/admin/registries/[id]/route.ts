import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult} from "@/server/auth/request";
import {readRegistryItem} from "@/server/registries/items";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const item=await withSprintIndexDb(db=>readRegistryItem(db,id));
  return jsonResult(item?{item}:{error:"not-found"},item?200:404);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}
