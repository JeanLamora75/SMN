import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listReportTemplates,manageReportTemplate} from "@/server/reports/templates";
export const dynamic="force-dynamic";export const runtime="nodejs";
const scope={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"write",scope))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({templates:await withLegacyReportReadDb(listReportTemplates)});}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",scope);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);if(!input)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>manageReportTemplate(db,actor.id,input));
 return jsonResult(result,result.ok?200:result.error==="protected"?403:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
