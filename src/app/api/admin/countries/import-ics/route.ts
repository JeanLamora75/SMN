import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {executeHolidayIcs} from "@/server/holidays/ics-import";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
const MAX_REQUEST_BYTES=1536*1024;
async function readIcsRequest(request:NextRequest):Promise<Record<string,unknown>|null>{
 if(request.headers.get("content-type")?.split(";")[0]?.trim()!=="application/json")return null;
 const length=Number(request.headers.get("content-length")??"0");
 if(!Number.isFinite(length)||length>MAX_REQUEST_BYTES)return null;
 const reader=request.body?.getReader();
 if(!reader)return null;
 const parts:Uint8Array[]=[];let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>MAX_REQUEST_BYTES){await reader.cancel();return null;}
   parts.push(value);
  }
  const decoded=new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(parts));
  const object:unknown=JSON.parse(decoded);
  return object&&typeof object==="object"&&!Array.isArray(object)?
   object as Record<string,unknown>:null;
 }catch{return null;}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readIcsRequest(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>executeHolidayCsv(db,body,actor.id));
  if(!result.ok)return jsonResult(result,
   result.error==="preview-expired"?409:
   result.error==="country-not-found"?404:
   result.error==="ics-too-large"?413:400);
  return jsonResult(result);
 }catch{
  console.error("smn-ics-national-holiday-import-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
