import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {parseCapacityPeriod,readDevelopmentCapacity} from "@/server/capacity/engine";
import {readCapacityOverride,saveCapacityOverride} from "@/server/capacity/override";
import {readInitialSnapshot} from "@/server/capacity/opening";
import {resolveAdminTeam} from "@/server/teams/resolve";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const search=request.nextUrl.searchParams;
 if([...search.keys()].some(k=>!["start","end","teamId"].includes(k))||
    search.getAll("teamId").length>1)return jsonResult({error:"invalid-input"},400);
 const period=parseCapacityPeriod(new URLSearchParams({
  start:search.get("start")??"",end:search.get("end")??""
 }));
 if(!period)return jsonResult({error:"invalid-period"},400);
 try{
  return jsonResult(await withAuthDb(async db=>{
   const version=await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   const schema=version.rows[0]?.schema_version;
   let teamId:string|undefined;
   if([28,29,30].includes(schema??0)){
    if(actor.role!=="admin")throw Error("capacity-team-forbidden");
    const team=await resolveAdminTeam(db,
      {accountId:actor.id,role:actor.role},search.get("teamId"));
    teamId=team.team_id;
   }else if(typeof schema!=="number"||schema<1||schema>27)
     throw Error("capacity-schema-unsupported");
   const report=await readDevelopmentCapacity(db,period.start,period.end,
     teamId?{teamId}:{});
   if(![28,29,30].includes(schema??0)&&search.has("teamId")&&search.get("teamId")!==report.team.id)
    throw Error("capacity-team-unavailable");
   const selection=await readCapacityOverride(db,report);
   const initialSnapshot=await readInitialSnapshot(db,report.team.id,report.start,report.end);
   return {...report,selection,initialSnapshot};
  }));
 }catch{
  console.error("capacity-computation-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const version=await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   if((version.rows[0]?.schema_version??0)>=28)
    throw Error("capacity-write-pending-team-isolation");
   return saveCapacityOverride(db,actor.id,body);
  });
  if(!result.ok)return jsonResult({error:result.error},
   result.error==="protected"?423:
   result.error==="conflict"||result.error==="nothing-to-clear"?409:
   result.error==="team-unavailable"?503:400);
  return jsonResult(result);
 }catch{
  console.error("capacity-override-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
