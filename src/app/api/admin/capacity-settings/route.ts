import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readCapacitySettings,updateCapacitySettings} from "@/server/capacity/settings";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(readCapacitySettings));}
 catch{console.error("capacity-settings-read-unavailable");return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>updateCapacitySettings(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},result.error==="conflict"?409:400);
  return jsonResult(result);
 }catch{console.error("capacity-settings-write-unavailable");return jsonResult({error:"service-unavailable"},503);}
}
