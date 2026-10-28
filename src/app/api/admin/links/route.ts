import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listLinks,createLink,normalizeLink,mapLinkError} from "@/server/links/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const teamId=request.nextUrl.searchParams.get("teamId");
 if(!teamId)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult({items:await withAuthDb(db=>listLinks(db,actor,teamId))});}
 catch(error){const result=mapLinkError(error);return jsonResult({error:result.error},result.status);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,8192);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult({item:await withAuthDb(db=>createLink(db,actor,normalizeLink(body)))},201);}
 catch(error){const result=mapLinkError(error);return jsonResult({error:result.error},result.status);}
}
