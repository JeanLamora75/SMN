import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {withAuthDb} from "@/server/auth/database";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readLinks,changeCycleLink} from "@/server/registries/cycle-links";
export const dynamic="force-dynamic";export const runtime="nodejs";
const target={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if([...req.nextUrl.searchParams.keys()].some(k=>k!=="teamId")||
  req.nextUrl.searchParams.getAll("teamId").length>1)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const v=await withSprintIndexDb(async db=>{
   const context=await resolveRegistryReadContext(db,{accountId:actor.id,role:actor.role},
    req.nextUrl.searchParams.get("teamId"));
   return readLinks(db,id,context.team?.team_id);
  });
  return jsonResult(v??{error:"not-found"},v?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body||Object.keys(body).some(k=>!["action","cycleId","teamId"].includes(k))||
  typeof body.cycleId!=="string"||(body.action!=="linked"&&body.action!=="unlinked")||
  (body.teamId!==undefined&&typeof body.teamId!=="string"))
  return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const v=await withAuthDb(async db=>{
   const context=await resolveRegistryReadContext(db,{accountId:actor.id,role:actor.role},
    typeof body.teamId==="string"?body.teamId:null);
   if(context.version===28&&(!body.teamId||context.team?.team_id!==body.teamId))
    return {ok:false as const,error:"invalid-input" as const};
   return changeCycleLink(db,actor.id,id,body.cycleId as string,
    body.action as "linked"|"unlinked",context.team?.team_id);
  });
  return jsonResult(v,v.ok?200:v.error==="conflict"?409:v.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
