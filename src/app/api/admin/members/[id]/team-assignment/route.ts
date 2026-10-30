import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {saveTeamAssignmentRevision} from "@/server/members/team-assignment-write";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

/** Nouvelle mutation d'affectation v28 : inaccessible tant que tous les
 * consommateurs de données multiéquipes n'ont pas été qualifiés.
 * L'ancienne API membre/assignment reste fermée en v28.
 */
export async function POST(request:NextRequest,
 {params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size)
  return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,4096);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>saveTeamAssignmentRevision(db,
   {accountId:actor.id,role:"admin"},id,body));
  if(result.ok)return jsonResult(result,201);
  return jsonResult({error:result.error},
   result.error==="invalid-input"?400:
   result.error==="not-found"||result.error==="assignment-not-active"?404:409);
 }catch(error){
  if(error instanceof Error&&
   ["team-access-forbidden","team-context-unavailable","team-id-invalid",
    "team-context-not-ready"].includes(error.message))
    return jsonResult({error:"not-found"},404);
  if((error as {code?:unknown})?.code==="23505")
   return jsonResult({error:"conflict"},409);
  console.error("team-member-assignment-update-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const teamId=request.nextUrl.searchParams.get("teamId"),{id}=await params;
 if(!teamId||[...request.nextUrl.searchParams.keys()].some(k=>k!=="teamId"))return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withAuthDb(async db=>{
  const {readTeamAssignmentHistory}=await import("@/server/members/team-assignment-history");
  const history=await readTeamAssignmentHistory(db,{accountId:actor.id,role:"admin"},id,teamId);
  const latest=history.versions[0],today=(await db.query<{today:string}>("SELECT CURRENT_DATE::text AS today")).rows[0].today;
  return {memberId:id,teamId,assignmentId:latest.assignmentId,startOn:latest.startOn,today,
   latestRevision:latest.revision,current:{
    revision:latest.revision,effectiveFrom:latest.effectiveFrom,contractPercent:latest.contractPercent,
    allocationPercent:latest.allocationPercent,contributionPercent:latest.contributionPercent,
    shares:{scrumMaster:latest.scrumMasterPercent,productOwner:latest.productOwnerPercent,developer:latest.developerPercent},
    developerShare:latest.developerPercent/100
   },versions:[...history.versions].reverse().map(v=>({
    revision:v.revision,effectiveFrom:v.effectiveFrom,contractPercent:v.contractPercent,
    allocationPercent:v.allocationPercent,contributionPercent:v.contributionPercent,
    shares:{scrumMaster:v.scrumMasterPercent,productOwner:v.productOwnerPercent,developer:v.developerPercent},
    developerShare:v.developerPercent/100
   }))};
 }));}catch{return jsonResult({error:"not-found"},404);}
}
