import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {grantArchiveUser,revokeArchiveUser} from "@/server/reports/archive-grants";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params,body=await readJsonObject(req);
 const userId=body?.userId;
 if(typeof userId!=="string")return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>grantArchiveUser(db,id,userId,actor.id));
 return jsonResult(result,result.ok?200:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}

export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params,body=await readJsonObject(req);
 const userId=body?.userId;
 if(typeof userId!=="string")return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>revokeArchiveUser(db,id,userId));
 return jsonResult(result,result.ok?200:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
