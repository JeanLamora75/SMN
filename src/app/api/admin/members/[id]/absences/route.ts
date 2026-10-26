import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readMemberAbsences,saveMemberAbsence} from "@/server/members/absence";
import {readMemberDayAvailability} from "@/server/members/day-availability";
import {revalidatePath} from "next/cache";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const onDate=new URL(request.url).searchParams.get("onDate")??undefined;
 try{return jsonResult(await withLegacyMemberApi(async db=>{
   const data=await readMemberAbsences(db,id,onDate);
   const dayAvailability=onDate?
    await readMemberDayAvailability(db,id,onDate,data.absences.filter(absence=>!absence.deleted)):null;
   const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
   return {...data,today,dayAvailability};
  }));}
 catch(error){
  if(error instanceof Error&&error.message==="member-absence-invalid-input")
   return jsonResult({error:"invalid-input"},400);
  if(error instanceof Error&&error.message==="member-not-found")
   return jsonResult({error:"not-found"},404);
  console.error("member-absence-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyMemberApi(db=>saveMemberAbsence(db,id,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},
   result.error==="not-found"?404:
   ["conflict","overlap","archived","category-inactive"].includes(result.error)?409:400);
  // Ces écrans recalculent leur capacité à la lecture : ne pas modifier les
  // snapshots initiaux/clos, seulement invalider leurs vues dynamiques.
  revalidatePath("/app/admin/development-capacity");
  revalidatePath("/app/team-calendar");
  revalidatePath("/app");
  return jsonResult({...result,capacityRefresh:"on-demand"},result.created?201:200);
 }catch{
  console.error("member-absence-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
