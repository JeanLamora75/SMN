import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {preloadNationalCalendar} from "@/server/holidays/preload";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;

/** Relecture explicite des jeux locaux, sans paramètre de chemin fourni par le client. */
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{
  const result=await withAuthDb(async db=>{
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
