import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {listDashboardSources} from "@/server/dashboard-builder/sources";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=[...request.nextUrl.searchParams.keys()];
 const teamId=request.nextUrl.searchParams.get("teamId");
 if(params.length!==1||params[0]!=="teamId"||!teamId||!/^[A-Za-z0-9_-]{1,80}$/.test(teamId))
  return jsonResult({error:"invalid-input"},400);
 try {
  const result=await withAuthDb(async db=>{
   const account=await db.query<{installation_id:string}>(
    "SELECT installation_id FROM public.smn_account WHERE id=$1 AND is_active=true AND must_change_password=false",
    [actor.id]);
   if(account.rows.length!==1)throw Error("dashboard-scope-forbidden");
   return listDashboardSources(db,{installationId:account.rows[0].installation_id,accountId:actor.id,teamId});
  });
  return jsonResult({sources:result});
 }catch(e){
  if(e instanceof Error&&e.message==="dashboard-scope-forbidden")
   return jsonResult({error:"forbidden"},403);
  console.error("dashboard-source-catalog-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
