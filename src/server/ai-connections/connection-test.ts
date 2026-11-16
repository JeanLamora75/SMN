import "server-only";
import type {Client} from "pg";
import {evaluateFreeModel,type ProviderId} from "./free-catalog";
import {loadAiCredential} from "./vault";
import {sendFreeAiPrompt} from "./providers";
import {reserveFreeAiRequest} from "./free-quota";
type Row={id:string;revision:number;provider_id:ProviderId;model_id:string|null;
 credential_state:string;enabled:boolean};
export async function testAiConnection(db:Client,id:string,revision:number){
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)||
   !Number.isSafeInteger(revision)||revision<1)return {ok:false as const,error:"invalid-input"};
 const selected=await db.query<Row>(`SELECT id::text,revision,provider_id,model_id,credential_state,enabled
  FROM public.smn_ai_connection WHERE id=$1 AND installation_id='singleton'`,[id]);
 const row=selected.rows[0];
 if(!row||row.revision!==revision)return {ok:false as const,error:"conflict-or-not-found"};
 if(row.credential_state!=="configured"||!row.model_id)
  return {ok:false as const,error:"credential-or-model-missing"};
 const free=evaluateFreeModel(row.provider_id,row.model_id);
 if(!free.allowed)return {ok:false as const,error:free.reason};
 let secret:Buffer;
 try{secret=await loadAiCredential(id,row.provider_id,row.revision);}
 catch{return {ok:false as const,error:"credential-unavailable"};}
 let result:Awaited<ReturnType<typeof sendFreeAiPrompt>>;
 try{
  const quota=await reserveFreeAiRequest(db,id,new Date(),"probe");
  if(!quota.ok)return quota;
  // Never transmit sprint data in this operation.
  result=await sendFreeAiPrompt(row.provider_id,row.model_id,
   "Reply with the single word OK. This is an anonymous SMN API connectivity test.",secret);
 }finally{secret.fill(0);}
 const status=result.ok?"passed":result.error==="provider-rate-limit"?"quota":
  result.error==="authentication-failed"?"failed":"unavailable";
 const changed=await db.query(`UPDATE public.smn_ai_connection
  SET enabled=$3,last_test_status=$4,last_test_at=now(),
    revision=revision+1,updated_at=now()
  WHERE id=$1 AND installation_id='singleton' AND revision=$2
    AND provider_id=$5 AND model_id=$6 AND credential_state='configured'
  RETURNING revision`,
 [id,revision,result.ok,status,row.provider_id,row.model_id]);
 if(!changed.rowCount)return {ok:false as const,error:"conflict-or-not-found"};
 return result.ok?{ok:true as const,tested:true,revision:revision+1}:
  {ok:false as const,error:result.error,tested:true,revision:revision+1};
}
