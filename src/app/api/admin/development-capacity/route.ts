import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {parseCapacityPeriod,readDevelopmentCapacity} from "@/server/capacity/engine";
import {readCapacityOverride,saveCapacityOverride} from "@/server/capacity/override";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))
  return jsonResult({error:"forbidden"},403);
 const period=parseCapacityPeriod(request.nextUrl.searchParams);
 if(!period)return jsonResult({error:"invalid-period"},400);
 try{
  return jsonResult(await withAuthDb(async db=>{
   const report=await readDevelopmentCapacity(db,period.start,period.end);
   const selection=await readCapacityOverride(db,report);
   return {...report,selection};
  }));
 }catch{
  console.error("capacity-computation-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>saveCapacityOverride(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},
   result.error==="protected"?423:
   result.error==="conflict"||result.error==="nothing-to-clear"?409:
   result.error==="team-unavailable"?503:400);
  return jsonResult(result);
 }catch{
  console.error("capacity-override-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
