import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readKanbanTrends} from "@/server/kanban/trends";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const trends=await withAuthDb(db=>readKanbanTrends(db,id));
  return trends?jsonResult(trends):jsonResult({error:"not-found"},404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
