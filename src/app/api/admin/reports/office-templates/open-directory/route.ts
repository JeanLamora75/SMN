import type {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {isOfficeDirectoryKind,openOfficeDirectory} from "@/server/reports/open-office-directory";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const scope={type:"settings",exists:true,inScope:true} as const;

/** Local-only authenticated action: the browser submits a fixed directory kind, never a path. */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"read",scope);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request,256);
 if(!input||!isOfficeDirectoryKind(input.kind))return jsonResult({error:"invalid-input"},400);
 if(process.platform!=="win32")return jsonResult({error:"unsupported-platform"},409);
 try{
  await openOfficeDirectory(input.kind);
  return jsonResult({ok:true});
 }catch{
  return jsonResult({error:"explorer-unavailable"},503);
 }
}
