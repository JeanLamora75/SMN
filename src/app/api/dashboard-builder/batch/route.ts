import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readDashboardBatch,validateBatchRequests} from "@/server/dashboard-builder/batch";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request,65536);
 if(!input||typeof input.teamId!=="string"||!/^[A-Za-z0-9_-]{1,80}$/.test(input.teamId))
  return jsonResult({error:"invalid-input"},400);
 let items;
 try{items=validateBatchRequests(input.items);}catch{return jsonResult({error:"invalid-input"},400);}
 try{
  const results=await withAuthDb(async db=>{
   const account=await db.query<{installation_id:string}>(
    "SELECT installation_id FROM public.smn_account WHERE id=$1 AND is_active=true AND must_change_password=false",[actor.id]);
   if(account.rows.length!==1)throw Error("dashboard-scope-forbidden");
   return readDashboardBatch(db,{installationId:account.rows[0].installation_id,
    accountId:actor.id,teamId:input.teamId as string},items);
  });
  return jsonResult({results});
 }catch(error){
  if(error instanceof Error&&error.message==="dashboard-scope-forbidden")return jsonResult({error:"forbidden"},403);
  console.error("dashboard-builder-batch-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
