import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {parseCapacityPeriod} from "@/server/capacity/engine";
import {readActualCapacity,saveActualCapacity} from "@/server/capacity/actual";
import {resolveAdminTeam} from "@/server/teams/resolve";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const query=request.nextUrl.searchParams;
 if([...query.keys()].some(key=>!["start","end","teamId"].includes(key))||
   query.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 const p=parseCapacityPeriod(new URLSearchParams({
  start:query.get("start")??"",end:query.get("end")??""
 }));
 if(!p)return jsonResult({error:"invalid-period"},400);
 try{return jsonResult(await withAuthDb(async db=>{
   const v=await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   if([28,29,30,31,32].includes(v.rows[0]?.schema_version??0)){
    if(actor.role!=="admin")throw Error("actual-capacity-team-forbidden");
    const team=await resolveAdminTeam(db,
     {accountId:actor.id,role:actor.role},query.get("teamId"));
    const capacity=await readActualCapacity(db,p.start,p.end,undefined,
     {teamId:team.team_id});
    return {...capacity,teamId:team.team_id};
   }
   if(typeof v.rows[0]?.schema_version!=="number"||
      v.rows[0].schema_version<1||v.rows[0].schema_version>27||
      query.has("teamId"))throw Error("actual-capacity-team-unavailable");
   return readActualCapacity(db,p.start,p.end);
  }));}
 catch{console.error("actual-capacity-read-failed");return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const r=await withAuthDb(async db=>{
   const version=await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   if((version.rows[0]?.schema_version??0)>=28)
    throw Error("capacity-write-pending-team-isolation");
   return saveActualCapacity(db,actor.id,body);
  });
  if(!r.ok)return jsonResult({error:r.error},
   r.error==="protected"?423:r.error==="conflict"||r.error==="nothing-to-clear"?409:
   r.error==="future-period"?400:r.error==="team-unavailable"?503:400);
  return jsonResult(r);
 }catch{console.error("actual-capacity-write-failed");return jsonResult({error:"service-unavailable"},503);}
}
