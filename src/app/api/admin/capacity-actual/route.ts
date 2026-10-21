import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {parseCapacityPeriod} from "@/server/capacity/engine";
import {readActualCapacity,saveActualCapacity} from "@/server/capacity/actual";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))
  return jsonResult({error:"forbidden"},403);
 const p=parseCapacityPeriod(request.nextUrl.searchParams);
 if(!p)return jsonResult({error:"invalid-period"},400);
 try{return jsonResult(await withAuthDb(db=>readActualCapacity(db,p.start,p.end)));}
 catch{console.error("actual-capacity-read-failed");return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const r=await withAuthDb(db=>saveActualCapacity(db,actor.id,body));
  if(!r.ok)return jsonResult({error:r.error},
   r.error==="protected"?423:r.error==="conflict"||r.error==="nothing-to-clear"?409:
   r.error==="future-period"?400:r.error==="team-unavailable"?503:400);
  return jsonResult(r);
 }catch{console.error("actual-capacity-write-failed");return jsonResult({error:"service-unavailable"},503);}
}
