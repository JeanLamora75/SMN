import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {issueBatchPreview} from "@/server/sprints/batch-confirm";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {teamId,...payload}=input;
 if(teamId!==undefined&&typeof teamId!=="string")return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>issueBatchPreview(db,actor.id,payload,typeof teamId==="string"?teamId:null));
  return result.ok?jsonResult(result):jsonResult(result,400);
 }catch{return jsonResult({error:"preview-unavailable"},503);}
}
