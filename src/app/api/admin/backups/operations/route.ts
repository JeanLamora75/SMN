import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {readProtectionDiagnostics} from "@/server/backup/protection-diagnostics";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"backups",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(request.nextUrl.searchParams.size)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(readProtectionDiagnostics);
  return jsonResult(result);
 }catch{return jsonResult({error:"diagnostic-unavailable"},503);}
}
