import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {kanbanAnalysisCandidates,readKanbanAnalysisIds,saveKanbanAnalyses} from "@/server/kanban/report-analysis-choices";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 try{const data=await withAuthDb(async db=>({candidates:await kanbanAnalysisCandidates(db,id),selected:await readKanbanAnalysisIds(db,id)}));
 return jsonResult(data.candidates?data:{error:"not-found"},data.candidates?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;const body=await readJsonObject(req,16000);
 if(!/^[a-f0-9-]{36}$/i.test(id)||!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withAuthDb(db=>saveKanbanAnalyses(db,id,body.selected));
 return jsonResult(result,result.ok?200:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
