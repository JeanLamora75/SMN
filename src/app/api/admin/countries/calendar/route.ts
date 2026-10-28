import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {preloadNationalCalendar} from "@/server/holidays/preload";
import {isValidCountry} from "@/server/members/location";
import {readAnnualHolidaySnapshot} from "@/server/holidays/manual";
import {ensureManualHolidaySchema} from "@/server/holidays/manual-migration";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;

/** Relecture explicite des jeux locaux, sans paramètre de chemin fourni par le client. */
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{
  const result=await withAuthDb(async db=>{
   await ensureManualHolidaySchema(db);
   const r=await db.query<{country:string|null;year:number}>(`SELECT
     s.reference_country AS country,EXTRACT(YEAR FROM i.created_at)::integer AS year
     FROM public.smn_general_settings s JOIN public.smn_installation i
       ON i.id=s.installation_id WHERE s.installation_id='singleton'`);
   const ref=r.rows[0];
   if(!ref?.country)return {country:null,coverage:[]};
   return {country:ref.country,coverage:await preloadNationalCalendar(db,ref.country,ref.year)};
  });
  return jsonResult(result);
 }catch{
  console.error("smn-national-calendar-refresh-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}

/** Admin-only annual drilldown; POST remains reserved for explicit local refresh. */
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 const code=req.nextUrl.searchParams.get("country");
 const yearText=req.nextUrl.searchParams.get("year");
 if(!code||!isValidCountry(code)||!yearText||! /^\d{4}$/.test(yearText))
  return jsonResult({error:"invalid-input"},400);
 const year=Number(yearText);
 if(year<1900||year>2200)return jsonResult({error:"invalid-input"},400);
 try{
  const snapshot=await withAuthDb(async db=>{
   await ensureManualHolidaySchema(db);
   return readAnnualHolidaySnapshot(db,code,year);
  });
  if(!snapshot)return jsonResult({error:"country-not-found"},404);
  return jsonResult(snapshot);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
