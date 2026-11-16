import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withSessionReadDb} from "@/server/auth/database";
import {loadAiCredential} from "@/server/ai-connections/vault";
export const dynamic="force-dynamic";
export const runtime="nodejs";
/** Local vault integrity only, not an upstream API test. No secret in the response. */
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 const id=req.nextUrl.searchParams.get("id");
 if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i.test(id))
  return jsonResult({error:"invalid-input"},400);
 try{
  const entry=await withSessionReadDb(async db=>{
   const r=await db.query<{provider_id:string;revision:number;credential_state:string}>(`
    SELECT provider_id,revision,credential_state FROM public.smn_ai_connection
    WHERE id=$1 AND installation_id='singleton'`,[id]);
   return r.rows[0]??null;
  });
  if(!entry)return jsonResult({error:"not-found"},404);
  if(entry.credential_state!=="configured")return jsonResult({localStatus:"missing",apiTested:false});
  try{
   const secret=await loadAiCredential(id,entry.provider_id,entry.revision);
   secret.fill(0);
   return jsonResult({localStatus:"present",apiTested:false});
  }catch{return jsonResult({localStatus:"missing",apiTested:false});}
 }catch{return jsonResult({error:"unavailable"},503);}
}
