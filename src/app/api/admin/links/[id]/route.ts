import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {getLink,updateLink,deleteLink,normalizeLink,mapLinkError} from "@/server/links/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
type Context={params:Promise<{id:string}>};
export async function GET(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const teamId=request.nextUrl.searchParams.get("teamId");
 if(!teamId)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{return jsonResult({item:await withAuthDb(db=>getLink(db,actor,teamId,id))});}
 catch(error){const result=mapLinkError(error);return jsonResult({error:result.error},result.status);}
}
export async function PUT(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,8192);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{return jsonResult({item:await withAuthDb(db=>updateLink(db,actor,id,normalizeLink(body),body.revision as number))});}
 catch(error){const result=mapLinkError(error);return jsonResult({error:result.error},result.status);}
}
export async function DELETE(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,1024);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{return jsonResult(await withAuthDb(db=>deleteLink(db,actor,id,body.revision as number)));}
 catch(error){const result=mapLinkError(error);return jsonResult({error:result.error},result.status);}
}
