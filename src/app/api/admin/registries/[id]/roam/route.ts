import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readRiskRoam,updateRiskRoam} from "@/server/registries/roam";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const result=await withLegacyRegistryReadDb(async db=>{
   const found=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_risk_roam') IS NOT NULL AS present`);
   if(found.rows[0]?.present)return readRiskRoam(db,id);
   const item=await db.query(`SELECT r.id FROM public.smn_registry_item r
    JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE r.id=$1 AND r.type='risk' AND i.id='singleton' AND i.state='initialized'`,[id]);
   return item.rows.length===1?{classification:null,revision:0,updatedAt:null}:null;
  });
  return jsonResult(result??{error:"not-found"},result?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withLegacyTeamApi(db=>updateRiskRoam(db,actor.id,id,body));
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
