import {NextRequest} from "next/server";
import {withTeamReportCycle} from "@/server/reports/team-cycle";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readReportHistoryOptions,saveReportHistoryOptions} from "@/server/reports/history-options";
import {readReportTrends} from "@/server/reports/history-trends";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const reader=await authorizeApi(req,"write",target);
 if(!reader)return jsonResult({error:"forbidden"},403);
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&reader.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const data=teamId?await withTeamReportCycle({accountId:reader.id,role:reader.role},teamId,id,async db=>{
 const options=await readReportHistoryOptions(db,id);
 const trends=await readReportTrends(db,id,options.depth);
 return trends===null?null:{...options,trends};
 }):await withLegacyReportReadDb(async db=>{
 const options=await readReportHistoryOptions(db,id);
 const trends=await readReportTrends(db,id,options.depth);
 return trends===null?null:{...options,trends};
 });return jsonResult(data??{error:"not-found"},data?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const r=teamId?await withTeamReportCycle({accountId:actor.id,role:actor.role},teamId,id,db=>saveReportHistoryOptions(db,id,actor.id,input)):await withLegacyTeamApi(db=>saveReportHistoryOptions(db,id,actor.id,input));
 if(!r)return jsonResult({error:"not-found"},404);
 return jsonResult(r,r.ok?200:r.error==="not-found"?404:r.error==="conflict"?409:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
