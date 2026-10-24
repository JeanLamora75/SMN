import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {previewDateChange,applyDateChange} from "@/server/kanban/date-correction";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input||typeof input.startOn!=="string"||typeof input.endOn!=="string"||Object.keys(input).sort().join(",")!=="endOn,startOn")return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const result=await withAuthDb(db=>previewDateChange(db,id,input.startOn,input.endOn));
  return result?jsonResult(result):jsonResult({error:"not-found"},404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input||typeof input.startOn!=="string"||typeof input.endOn!=="string"||typeof input.previewToken!=="string"||
 Object.keys(input).some(k=>!["endOn","previewToken","startOn","reason"].includes(k))||(input.reason!==undefined&&(typeof input.reason!=="string"||input.reason.length>1000)))return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const result=await withAuthDb(db=>applyDateChange(db,id,actor.id,{startOn:input.startOn,endOn:input.endOn,previewToken:input.previewToken,reason:typeof input.reason==="string"?input.reason:undefined}));
  return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:409);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
