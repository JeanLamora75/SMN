import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {previewInstallationReset} from "@/server/installation/reset-preview";
import {assessResetRequest} from "@/server/installation/reset-policy";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"backups",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(request.nextUrl.searchParams.size)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await previewInstallationReset());}
 catch{return jsonResult({error:"reset-preview-unavailable"},503);}
}
/** Explicitly non-destructive. Confirmation is never sufficient without a
 * qualified restore/rollback mechanism, session shutdown and erasure ledger. */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,1024);
 if(!body||Object.keys(body).length!==1)return jsonResult({error:"invalid-input"},400);
 const verdict=assessResetRequest(body.confirmation,true);
 return jsonResult({error:verdict.reason,canExecute:false,
  blockers:verdict.blockers},verdict.reason==="confirmation-required"?400:409);
}
