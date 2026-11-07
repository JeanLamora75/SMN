import {NextRequest} from "next/server";
import {sessionAccount} from "@/server/auth/session";
import {SESSION_COOKIE,validLocalHost,validMutationOrigin} from "@/server/auth/guards";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {listIndicatorCatalog,applyCatalogCommand,IndicatorCatalogError,type CatalogCommand} from "@/server/indicators/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function actorFor(req:NextRequest,mutation:boolean){
 if(!validLocalHost(req.headers.get("host"))||(mutation&&!validMutationOrigin(req.headers.get("host"),req.headers.get("origin"))))return null;
 const actor=await sessionAccount(req.cookies.get(SESSION_COOKIE)?.value);
 return actor?.is_active===true&&actor.must_change_password===false?actor:null;
}
export async function GET(req:NextRequest){
 const actor=await actorFor(req,false);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{
  const teamId=req.nextUrl.searchParams.get("teamId")??undefined;
  return jsonResult(await withAuthDb(db=>listIndicatorCatalog(db,{accountId:actor.id,role:actor.role},teamId)),200);
 }catch(e){
  if(e instanceof IndicatorCatalogError)return jsonResult({error:e.code},e.code==="forbidden"?403:e.code==="schema-not-ready"?409:400);
  if(e instanceof Error&&e.message==="team-access-forbidden")return jsonResult({error:"forbidden"},403);
  console.error("indicator-catalog-read-failed");return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(req:NextRequest){
 const actor=await actorFor(req,true);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req,10000);
 if(!raw||typeof raw.action!=="string")return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withAuthDb(db=>applyCatalogCommand(db,{accountId:actor.id,role:actor.role},raw as CatalogCommand)),200);
 }catch(e){
  if(e instanceof IndicatorCatalogError)return jsonResult({error:e.code,...(e.formulaError?{formulaError:e.formulaError}:{})},e.code==="forbidden"?403:e.code==="not-found"?404:e.code==="invalid-input"?400:409);
  console.error("indicator-catalog-write-failed");return jsonResult({error:"service-unavailable"},503);
 }
}
