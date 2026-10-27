import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readReportAnalysisChoice,reportAnalysisCandidates,saveReportAnalysisChoice} from "@/server/reports/analysis-choices";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 try{const data=await withLegacyTeamApi(async db=>({candidates:await reportAnalysisCandidates(db,id),selected:await readReportAnalysisChoice(db,id)}));
 return jsonResult(data.candidates?data:{error:"not-found"},data.candidates?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(req,16000);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>saveReportAnalysisChoice(db,id,body.selected));
 return jsonResult(result,result.ok?200:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
