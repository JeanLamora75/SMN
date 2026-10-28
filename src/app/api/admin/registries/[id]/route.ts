import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readRegistryItem,updateRegistryItem} from "@/server/registries/items";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {readTeamRegistryItem} from "@/server/registries/team-item-read";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 if([...req.nextUrl.searchParams.keys()].some(k=>k!=="teamId")||
    req.nextUrl.searchParams.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  const item=await withSprintIndexDb(async db=>{
   const requestedTeamId=req.nextUrl.searchParams.get("teamId");
   const context=await resolveRegistryReadContext(db,{
    accountId:actor.id,role:actor.role
   },requestedTeamId);
   if(context.version===28)
    return readTeamRegistryItem(db,{
     accountId:actor.id,role:actor.role
    },context.team!.team_id,id);
   return readRegistryItem(db,id);
  });
  if(item&&actor.role!=="admin"){
   const {owner,comment,revision,createdAt,updatedAt,...collective}=item;
   return jsonResult({item:collective});
  }
  return jsonResult(item?{item}:{error:"not-found"},item?200:404);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body||!Number.isSafeInteger(body.revision))return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 const {revision,...input}=body;
 try{
  const result=await withAuthDb(async db=>{
   const requestedTeamId=typeof input.teamId==="string"?input.teamId:null;
   const context=await resolveRegistryReadContext(db,{
    accountId:actor.id,role:actor.role
   },requestedTeamId);
   if(context.version===28){
    if(!MULTI_TEAM_CONTEXT_READY||
       process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true")
     throw Error("registry-team-write-not-ready");
    if(!requestedTeamId||context.team?.team_id!==requestedTeamId)
     throw Error("registry-team-write-forbidden");
   }else await assertLegacyTeamApi(db);
   return updateRegistryItem(db,actor.id,id,revision as number,input);
  });
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:result.error==="not-found"?404:400);
 }catch(error){
  if(error instanceof Error&&error.message==="registry-team-write-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"service-unavailable"},503);
 }
}
