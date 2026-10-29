import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createQuickMembers,createIndividualMember,listTeamMembers} from "@/server/members/quick-create";
import {withMemberCompanies} from "@/server/members/company-presentation";
import {createCompanyMember} from "@/server/members/company-create";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {evaluateSchemaCapability} from "@/server/schema/compatibility";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(k=>k!=="teamId")||params.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withAuthDb(async db=>{
   const r=await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   const version=r.rows[0]?.schema_version;
   if(evaluateSchemaCapability(version,"multi-team").ok){
    if(actor.role!=="admin")throw Error("members-team-forbidden");
    const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},
      params.get("teamId"));
    const listed=await listTeamMembers(db,{
     id:team.team_id,name:team.team,mode:team.mode as "scrum"|"kanban"
    });
    return evaluateSchemaCapability(version,"company-catalog").ok?
      withMemberCompanies(db,listed):listed;
   }
   if(typeof version!=="number"||version<1||version>27)
    throw Error("members-schema-unavailable");
   const data=await listTeamMembers(db);
   if(params.has("teamId")&&params.get("teamId")!==data.team.id)
    throw Error("members-team-not-found");
   return data;
  }));
 }catch{
  console.error("smn-members-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const individual=Object.hasOwn(body,"displayName");
  if(individual){
   const current=await withAuthDb(async db=>{
    const r=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
    return r.rows[0]?.schema_version;
   });
   if(evaluateSchemaCapability(current,"company-catalog").ok){
    const single=await withAuthDb(db=>createCompanyMember(db,actor.id,body));
    if(!single.ok)return jsonResult({error:single.error},
     ["request-conflict","roster-full"].includes(single.error)?409:
     ["team-unavailable","not-initialized","company-unavailable"].includes(single.error)?404:400);
    const item=await withAuthDb(async db=>{
     const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},body.teamId as string);
     const listed=await withMemberCompanies(db,await listTeamMembers(db,{
      id:team.team_id,name:team.team,mode:team.mode as "scrum"|"kanban"
     }));
     return listed.members.find(m=>m.id===single.member.id);
    });
    return jsonResult({member:item??single.member,created:single.created},single.created?201:200);
   }
   if(current!==undefined&&current>32)return jsonResult({error:"schema-unavailable"},503);
   const single=await withAuthDb(db=>createIndividualMember(db,actor.id,body));
   if(!single.ok)return jsonResult({error:single.error},
    single.error==="request-conflict"||single.error==="roster-full"?409:
    single.error==="team-unavailable"||single.error==="not-initialized"?404:400);
   return jsonResult({member:single.member,created:single.created},single.created?201:200);
  }
  const result=await withAuthDb(db=>createQuickMembers(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},
   result.error==="already-initialized"||result.error==="request-conflict"?409:
   result.error==="team-unavailable"?404:400);
  return jsonResult({members:result.members,created:result.created},result.created?201:200);
 }catch{
  console.error("smn-members-create-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
