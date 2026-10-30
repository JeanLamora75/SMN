import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {requireTeamMemberScope} from "@/server/members/team-scope";
import {parseLocationChange} from "@/server/members/location";
export const dynamic="force-dynamic";
const target={type:"members",exists:true,inScope:true} as const;
type Context={params:Promise<{id:string}>};
export async function GET(req:NextRequest,{params}:Context){
 const actor=await authorizeApi(req,"read",target);if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {id}=await params,teamId=req.nextUrl.searchParams.get("teamId");
 if(!teamId||req.nextUrl.searchParams.size!==1)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withAuthDb(async db=>{
  await requireTeamMemberScope(db,{accountId:actor.id,role:"admin"},id,teamId);
  const rows=await db.query<{revision:number;country_iso2:string|null;region:string|null;city:string|null;time_zone:string|null;effective_from:string}>(`SELECT revision,country_iso2,region,city,time_zone,effective_from::text
    FROM public.smn_member_location WHERE member_id=$1 ORDER BY revision DESC LIMIT 1`,[id]);
  const today=(await db.query<{value:string}>("SELECT CURRENT_DATE::text AS value")).rows[0].value;
  return {current:rows.rows[0]??null,today};
 }));}catch{return jsonResult({error:"not-found"},404);}
}
export async function POST(req:NextRequest,{params}:Context){
 const actor=await authorizeApi(req,"write",target);if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {id}=await params,body=await readJsonObject(req);
 if(!body||typeof body.teamId!=="string"||!Object.hasOwn(body,"change")||Object.keys(body).length!==2)
  return jsonResult({error:"invalid-input"},400);
 const input=parseLocationChange(body.change);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{return await withAuthDb(async db=>{
  await db.query("BEGIN");
  try{
   await requireTeamMemberScope(db,{accountId:actor.id,role:"admin"},id,body.teamId as string);
   const member=await db.query<{archived_at:string|null}>(`SELECT archived_at::text FROM public.smn_member WHERE id=$1 FOR UPDATE`,[id]);
   if(!member.rows.length||member.rows[0].archived_at){await db.query("ROLLBACK");return jsonResult({error:"archived"},409);}
   const row=await db.query<{revision:number;effective_from:string}>(`SELECT revision,effective_from::text FROM public.smn_member_location WHERE member_id=$1 ORDER BY revision DESC LIMIT 1`,[id]);
   const latest=row.rows[0],today=(await db.query<{today:string}>("SELECT CURRENT_DATE::text AS today")).rows[0].today;
   if(input.effectiveFrom<today||latest&&input.effectiveFrom<latest.effective_from){await db.query("ROLLBACK");return jsonResult({error:"invalid-date"},409);}
   if((latest?.revision??0)!==input.revision){await db.query("ROLLBACK");return jsonResult({error:"conflict"},409);}
   await db.query(`INSERT INTO public.smn_member_location
    (id,member_id,revision,country_iso2,region,city,time_zone,effective_from,source,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8::date,'manual',$9)`,[
    randomUUID(),id,input.revision+1,input.countryIso2,input.region,input.city,input.timeZone,input.effectiveFrom,actor.id]);
   await db.query("COMMIT");return jsonResult({ok:true,revision:input.revision+1});
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 });}catch(error){console.error("member-team-location-write",error instanceof Error?error.message:error);return jsonResult({error:"unavailable"},503);}
}
