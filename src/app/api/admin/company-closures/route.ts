import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listClosuresForCompany,saveCompanyClosureV31} from "@/server/closures/company-service";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {listCompanyClosures,saveCompanyClosure} from "@/server/closures/service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"companies",exists:true,inScope:true} as const;
async function version(){
 return withAuthDb(async db=>{
  const q=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  return q.rows[0]?.schema_version;
 });
}
/** This historical endpoint remains for v30; v31 requires an explicit companyId. */
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 try{
  const v=await version();
  if(v===31){
   const params=request.nextUrl.searchParams;
   if([...params.keys()].some(k=>k!=="companyId")||params.getAll("companyId").length!==1)
    return jsonResult({error:"company-id-required"},400);
   const closures=await withAuthDb(db=>listClosuresForCompany(db,params.get("companyId")??""));
   return closures===null?jsonResult({error:"not-found"},404):jsonResult({closures});
  }
  if(typeof v==="number"&&v<=27)return jsonResult(await withLegacyTeamApi(listCompanyClosures));
  return jsonResult({error:"legacy-closure-unavailable"},409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const v=await version();
  if(v===31){
   const result=await withAuthDb(db=>saveCompanyClosureV31(db,actor.id,body));
   if(result.ok)return jsonResult(result,result.created?201:200);
   return jsonResult({error:result.error},["company-not-found","not-found"].includes(result.error)?404:
    ["overlap","conflict"].includes(result.error)?409:400);
  }
  if(typeof v==="number"&&v<=27){
   const result=await withLegacyTeamApi(db=>saveCompanyClosure(db,actor.id,body));
   if(!result.ok)return jsonResult({error:result.error},
    ["team-not-found","not-found"].includes(result.error)?404:
    ["overlap","conflict"].includes(result.error)?409:400);
   return jsonResult(result,result.created?201:200);
  }
  return jsonResult({error:"legacy-closure-unavailable"},409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
