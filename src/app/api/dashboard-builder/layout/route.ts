import { NextRequest } from "next/server";
import { authorizeApi } from "@/server/auth/authorization";
import { withAuthDb } from "@/server/auth/database";
import { jsonResult, readJsonObject } from "@/server/auth/request";
import { readDashboardLayout, saveDashboardLayout, type DashboardLayout } from "@/server/dashboard-builder/layout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const resource = {type:"collective",exists:true,inScope:true} as const;
const validTeamId=(v:unknown):v is string=>typeof v==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);

async function scopeFor(db:import("pg").Client,accountId:string,teamId:string){
 const result=await db.query<{installation_id:string}>(`
 SELECT a.installation_id FROM public.smn_account a
 JOIN public.smn_team t ON t.installation_id=a.installation_id AND t.id=$2
 WHERE a.id=$1 AND a.is_active=true AND a.must_change_password=false
 AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false`,[accountId,teamId]);
 if(result.rows.length!==1)throw new Error("dashboard-scope-forbidden");
 return {installationId:result.rows[0].installation_id,accountId,teamId};
}
function failure(error:unknown){
 if(error instanceof Error){
  if(error.message==="dashboard-revision-conflict")
   return jsonResult({error:"revision-conflict",message:"La disposition a été modifiée dans une autre session. Votre brouillon est conservé.",keepDraft:true},409);
  if(error.message.startsWith("dashboard-layout-")||error.message==="dashboard-revision-invalid")
   return jsonResult({error:"invalid-layout",message:"La disposition proposée est invalide.",keepDraft:true},400);
  if(error.message==="dashboard-scope-forbidden"||error.message==="dashboard-scope-invalid")
   return jsonResult({error:"forbidden",keepDraft:true},403);
  if((error as Error & {code?:string}).code==="42P01")
   return jsonResult({error:"schema-not-ready",keepDraft:true},503);
 }
 console.error("dashboard-builder-layout-unavailable");
 return jsonResult({error:"service-unavailable",message:"Enregistrement indisponible. Réessayez sans perdre votre brouillon.",keepDraft:true},503);
}
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const values=[...request.nextUrl.searchParams.keys()];
 const teamId=request.nextUrl.searchParams.get("teamId");
 if(values.length!==1||values[0]!=="teamId"||!validTeamId(teamId))return jsonResult({error:"invalid-input"},400);
 try{
  const data=await withAuthDb(async db=>readDashboardLayout(db,await scopeFor(db,actor.id,teamId)));
  return jsonResult(data);
 }catch(error){return failure(error);}
}
async function write(request:NextRequest){
 // Authenticate the session and verify mutation origin; fine-grained edit rights
 // are checked inside the database transaction, including for non-admin users.
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden",keepDraft:true},403);
 if(request.nextUrl.searchParams.size!==0)return jsonResult({error:"invalid-input",keepDraft:true},400);
 const input=await readJsonObject(request,262144);
 if(!input||!validTeamId(input.teamId)||typeof input.expectedRevision!=="number"||
  !Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||
  !input.layout||typeof input.layout!=="object"||Array.isArray(input.layout))
  return jsonResult({error:"invalid-input",keepDraft:true},400);
 try {
  const result=await withAuthDb(async db=>saveDashboardLayout(db,
    await scopeFor(db,actor.id,input.teamId as string),
    input.layout as DashboardLayout,input.expectedRevision as number));
  return jsonResult(result);
 }catch(error){return failure(error);}
}
export const PUT=write;
export const PATCH=write;
