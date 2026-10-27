import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult} from "@/server/auth/request";
import {inspectReportData,refreshOneReport} from "@/server/reports/report-data-refresh";
export const dynamic="force-dynamic";export const runtime="nodejs";
type Params={params:Promise<{id:string;documentId:string}>};
export async function GET(req:NextRequest,{params}:Params){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id)||!/^[a-f0-9-]{36}$/i.test(documentId))return jsonResult({error:"invalid-input"},400);
 try{const data=await withLegacyTeamApi(db=>inspectReportData(db,id,documentId));return jsonResult(data??{error:"not-found"},data?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest,{params}:Params){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id,documentId}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id)||!/^[a-f0-9-]{36}$/i.test(documentId))return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>refreshOneReport(db,actor.id,id,documentId));return jsonResult(result,result.ok?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
