import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult} from "@/server/auth/request";
import {readRegistryCycles} from "@/server/registries/list";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 try{
  const result=await withSprintIndexDb(db=>readRegistryCycles(db));
  return jsonResult(result,result.state==="available"?200:503);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}
