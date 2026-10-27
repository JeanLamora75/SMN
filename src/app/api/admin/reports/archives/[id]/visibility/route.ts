import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {hidePdfArchive} from "@/server/reports/archive-visibility";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;const input=await readJsonObject(req);
 const reason=input?.reason;
 if(!input||input.action!=="hide"||typeof reason!=="string")return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>hidePdfArchive(db,id,actor.id,reason));
 return jsonResult(result,result.ok?200:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
