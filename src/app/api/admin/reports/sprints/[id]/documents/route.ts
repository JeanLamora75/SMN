import {NextRequest} from "next/server";
import {withAuthDb} from "@/server/auth/database";
import {listTeamStudioDocuments,createTeamStudioDocument} from "@/server/reports/team-studio";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createReportDocument,listReportDocuments} from "@/server/reports/report-documents";
export const dynamic="force-dynamic";export const runtime="nodejs";
const readTarget={type:"collective",exists:true,inScope:true} as const;
const writeTarget={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const reader=await authorizeApi(req,"read",readTarget);
 if(!reader)return jsonResult({error:"forbidden"},403);
 const {id}=await params,teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&reader.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const result=teamId?await withAuthDb(db=>listTeamStudioDocuments(db,{accountId:reader.id,role:reader.role},teamId,id)):await withLegacyReportReadDb(db=>listReportDocuments(db,id));
 return jsonResult(result??{error:"not-found"},result===null?404:200);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",writeTarget);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params,body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const result=teamId?await withAuthDb(db=>createTeamStudioDocument(db,{accountId:actor.id,role:actor.role},teamId,id,body)):await withLegacyTeamApi(db=>createReportDocument(db,actor.id,id,body));
 return jsonResult(result,result.ok?201:result.error==="not-found"||result.error==="template-not-found"?404:result.error==="conflict"?409:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
