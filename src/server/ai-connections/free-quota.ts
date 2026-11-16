import "server-only";
import type {Client} from "pg";
import {evaluateFreeModel} from "./free-catalog";

/** Called immediately before a single external call. Reservation is conservative:
 * a timeout or failed call still counts, so retries never burn quota silently.
 * All decisions occur in the database transaction, safe under concurrency.
 */
export async function reserveFreeAiRequest(db:Client,connectionId:string,now:Date=new Date()){
 const selected=await db.query<{provider_id:string;model_id:string|null;enabled:boolean;
  credential_state:string;last_test_status:string}>(`SELECT provider_id,model_id,enabled,
  credential_state,last_test_status FROM public.smn_ai_connection
  WHERE id=$1 AND installation_id='singleton'`,[connectionId]);
 const item=selected.rows[0];
 if(!item||!item.enabled||item.credential_state!=="configured"||item.last_test_status!=="passed")
  return {ok:false as const,error:"connection-unavailable"};
 const free=evaluateFreeModel(item.provider_id,item.model_id,now);
 if(!free.allowed)return {ok:false as const,error:free.reason};
 const result=await db.query<{request_count:number}>(`
  INSERT INTO public.smn_ai_free_request_quota
   (installation_id,connection_id,quota_day,request_count)
  VALUES('singleton',$1,($2::timestamptz AT TIME ZONE 'UTC')::date,1)
  ON CONFLICT (installation_id,connection_id,quota_day)
  DO UPDATE SET request_count=smn_ai_free_request_quota.request_count+1,
   updated_at=now()
  WHERE smn_ai_free_request_quota.request_count < $3
  RETURNING request_count`,[connectionId,now.toISOString(),free.evidence.dailyRequestLimit]);
 return result.rowCount===1
  ?{ok:true as const,requestCount:result.rows[0].request_count,limit:free.evidence.dailyRequestLimit}
  :{ok:false as const,error:"local-quota-exhausted"};
}
/** Classify responses without exposing an upstream response body, secret or URL. */
export function safeAiProviderError(status:number){
 if(status===401||status===403)return "authentication-failed" as const;
 if(status===429)return "provider-rate-limit" as const;
 if(status===402)return "billing-rejected" as const;
 if(status>=500)return "provider-unavailable" as const;
 return "provider-request-failed" as const;
}
