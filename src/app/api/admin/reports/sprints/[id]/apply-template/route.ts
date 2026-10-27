import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {applyReportTemplate} from "@/server/reports/template-application";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params,body=await readJsonObject(req);
 const templateId=body?.templateId;
 if(typeof templateId!=="string")return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>applyReportTemplate(db,actor.id,id,templateId));
 return jsonResult(result,result.ok?200:result.error==="template-unavailable"?409:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
