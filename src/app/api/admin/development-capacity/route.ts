import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {parseCapacityPeriod,readDevelopmentCapacity} from "@/server/capacity/engine";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))
  return jsonResult({error:"forbidden"},403);
 const period=parseCapacityPeriod(request.nextUrl.searchParams);
 if(!period)return jsonResult({error:"invalid-period"},400);
 try{return jsonResult(await withAuthDb(db=>readDevelopmentCapacity(db,period.start,period.end)));}
 catch(error){
  console.error("capacity-computation-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
