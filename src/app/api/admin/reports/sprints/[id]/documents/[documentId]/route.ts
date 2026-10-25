import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {getReportDocument,updateReportDocument} from "@/server/reports/report-documents";
export const dynamic="force-dynamic";export const runtime="nodejs";
type Params={params:Promise<{id:string;documentId:string}>};
export async function GET(req:NextRequest,{params}:Params){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))
 return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params;
 try{const result=await withSprintIndexDb(db=>getReportDocument(db,id,documentId));
 return jsonResult(result??{error:"not-found"},result?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:Params){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params,body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(db=>updateReportDocument(db,actor.id,id,documentId,body));
 return jsonResult(result,result.ok?200:result.error==="stale"?409:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
