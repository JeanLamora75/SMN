import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listCopyTargets,copySavedDashboard} from "@/server/dashboard-builder/copy";
import {readDashboardLayout} from "@/server/dashboard-builder/layout";
import {listDashboardSources} from "@/server/dashboard-builder/sources";
export const runtime="nodejs";
const resource={type:"collective",exists:true,inScope:true} as const;
const valid=(v:unknown):v is string=>typeof v==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
async function scope(db:import("pg").Client,accountId:string,teamId:string){
 const q=await db.query<{installation_id:string}>(`
 SELECT a.installation_id FROM public.smn_account a JOIN public.smn_team t
 ON t.installation_id=a.installation_id AND t.id=$2
 WHERE a.id=$1 AND a.is_active=true AND a.must_change_password=false`,[accountId,teamId]);
 if(!q.rows.length)throw Error("dashboard-scope-forbidden");
 return {installationId:q.rows[0].installation_id,accountId,teamId};
}
export async function GET(request:NextRequest){
 const user=await authorizeApi(request,"read",resource);
 if(!user)return jsonResult({error:"forbidden"},403);
 const sourceTeamId=request.nextUrl.searchParams.get("sourceTeamId");
 if(!valid(sourceTeamId))return jsonResult({error:"invalid-input"},400);
 try{
  return await withAuthDb(async db=>{
   const src=await scope(db,user.id,sourceTeamId);
   const targets=await listCopyTargets(db,src);
   const details=await Promise.all(targets.map(async t=>{
    const target={...src,teamId:t.id};
    const saved=await readDashboardLayout(db,target);
    const catalog=await listDashboardSources(db,target);
    return {id:t.id,name:t.name,revision:saved.revision,hasSavedLayout:saved.persisted,
     availableCodes:catalog.filter(s=>s.status==="available").map(s=>s.code)};
   }));
   return jsonResult({targets:details});
  });
 }catch{return jsonResult({error:"forbidden"},403);}
}
export async function POST(request:NextRequest){
 const user=await authorizeApi(request,"read",resource);
 if(!user)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request,4096);
 if(!input||!valid(input.sourceTeamId)||!valid(input.targetTeamId)||
 !Number.isSafeInteger(input.expectedRevision)||Number(input.expectedRevision)<0)
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>copySavedDashboard(db,
   await scope(db,user.id,input.sourceTeamId as string),input.targetTeamId as string,input.expectedRevision as number));
  return jsonResult(result);
 }catch(error){
  const message=error instanceof Error?error.message:"";
  return jsonResult({error:message==="dashboard-revision-conflict"?"revision-conflict":
   message==="dashboard-copy-source-not-saved"?"source-not-saved":"copy-unavailable"},
   message:message==="dashboard-revision-conflict"?"La disposition cible a changé. Actualisez la sélection avant de confirmer.":"Copie impossible. Aucune modification appliquée."},
   message==="dashboard-revision-conflict"?409:message==="dashboard-copy-source-not-saved"?400:403);
 }
}
