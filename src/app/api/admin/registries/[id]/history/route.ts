import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult} from "@/server/auth/request";
import {readRegistryHistory} from "@/server/registries/items";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",{type:"audit",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const history=await withSprintIndexDb(db=>readRegistryHistory(db,id));
  return jsonResult(history??{error:"not-found"},history?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
