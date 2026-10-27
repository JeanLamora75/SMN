import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult} from "@/server/auth/request";
import {readRegistryAuditTimeline} from "@/server/registries/audit-timeline";

export const dynamic="force-dynamic";
export const runtime="nodejs";

/** Audit access remains restricted by the existing resource policy. */
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"audit",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 const value=req.nextUrl.searchParams;
 if([...value.keys()].some(key=>key!=="page")||value.getAll("page").length>1)
  return jsonResult({error:"invalid-input"},400);
 const raw=value.get("page")??"1",page=Number(raw);
 if(!/^\d+$/.test(raw)||!Number.isSafeInteger(page)||page<1||page>10000)
  return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const history=await withLegacyRegistryReadDb(db=>readRegistryAuditTimeline(db,id,page));
  return jsonResult(history??{error:"not-found"},history?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
