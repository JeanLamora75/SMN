import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listClosuresForCompany,saveCompanyClosureV31} from "@/server/closures/company-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"companies",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(k=>k!=="companyId")||params.getAll("companyId").length!==1)
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>listClosuresForCompany(db,params.get("companyId")??""));
  return result===null?jsonResult({error:"not-found"},404):jsonResult({closures:result});
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>saveCompanyClosureV31(db,actor.id,body));
  if(result.ok)return jsonResult(result,result.created?201:200);
  return jsonResult({error:result.error},result.error==="company-not-found"||result.error==="not-found"?404:
    result.error==="conflict"||result.error==="overlap"?409:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
