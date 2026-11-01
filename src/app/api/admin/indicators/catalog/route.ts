import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {listIndicatorCatalog,applyCatalogCommand,IndicatorCatalogError,type CatalogCommand} from "@/server/indicators/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{
  const teamId=req.nextUrl.searchParams.get("teamId")??undefined;
  return jsonResult(await withAuthDb(db=>listIndicatorCatalog(db,{accountId:actor.id,role:"admin"},teamId)),200);
 }catch(e){
  if(e instanceof IndicatorCatalogError)return jsonResult({error:e.code},e.code==="schema-not-ready"?409:400);
  console.error("indicator-catalog-read-failed");return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req,10000);
 if(!raw||typeof raw.action!=="string")return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withAuthDb(db=>applyCatalogCommand(db,{accountId:actor.id,role:"admin"},raw as CatalogCommand)),200);
 }catch(e){
  if(e instanceof IndicatorCatalogError)return jsonResult({error:e.code},e.code==="forbidden"?403:e.code==="not-found"?404:e.code==="invalid-input"?400:409);
  console.error("indicator-catalog-write-failed");return jsonResult({error:"service-unavailable"},503);
 }
}
