import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {readTemplateUpdateOffer} from "@/server/reports/template-versioning";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string;documentId:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id)||!/^[a-f0-9-]{36}$/i.test(documentId))
 return jsonResult({error:"invalid-input"},400);
 try{
 const result=await withLegacyReportReadDb(db=>readTemplateUpdateOffer(db,id,documentId));
 return jsonResult(result??{error:"not-found"},result?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
