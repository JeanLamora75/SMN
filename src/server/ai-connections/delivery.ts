import "server-only";
import type {Client} from "pg";
import {readPrivateBriefArchive} from "@/server/ai-briefs/library";
import {evaluateFreeModel,type ProviderId} from "./free-catalog";
import {loadAiCredential} from "./vault";
import {reserveFreeAiRequest} from "./free-quota";
import {sendFreeAiPrompt} from "./providers";
import {createAiPreviewApproval,consumeAiPreviewApproval,type ApprovalBinding} from "./preview-approval";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
type Identity={accountId:string;sessionToken:string;archiveId:string;connectionId:string};
type Selected={id:string;provider_id:ProviderId;model_id:string|null;revision:number;
 enabled:boolean;credential_state:string;last_test_status:string};
export function validAiDeliveryInput(raw:unknown):raw is {archiveId:string;connectionId:string;approval?:string}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const x=raw as Record<string,unknown>;
 return typeof x.archiveId==="string"&&UUID.test(x.archiveId)&&
 typeof x.connectionId==="string"&&UUID.test(x.connectionId)&&
 (x.approval===undefined||typeof x.approval==="string"&&x.approval.length<=4096);
}
async function authoritative(db:Client,archiveId:string,connectionId:string){
 const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
 if(team.rows.length!==1)return {ok:false as const,error:"scope-unavailable"};
 const archive=await readPrivateBriefArchive(db,archiveId,team.rows[0].id);
 if(archive.state!=="ok")return {ok:false as const,error:archive.state};
 if(Buffer.byteLength(archive.text,"utf8")>160000)return {ok:false as const,error:"prompt-too-large"};
 // Archive contains the final server-verified SHA-256 snapshot of resolved tags
 // and the text intentionally finalized by the author; do not trust client text.
 const connections=await db.query<Selected>(`SELECT id::text,provider_id,model_id,revision,enabled,
  credential_state,last_test_status FROM public.smn_ai_connection
  WHERE id=$1 AND installation_id='singleton'`,[connectionId]);
 const connection=connections.rows[0];
 if(!connection||!connection.enabled||connection.credential_state!=="configured"||
    connection.last_test_status!=="passed"||!connection.model_id)
  return {ok:false as const,error:"connection-unavailable"};
 const free=evaluateFreeModel(connection.provider_id,connection.model_id);
 if(!free.allowed)return {ok:false as const,error:free.reason};
 return {ok:true as const,archive,connection,free};
}
function binding(identity:Identity,source:Extract<Awaited<ReturnType<typeof authoritative>>,{ok:true}>):ApprovalBinding{
 return {accountId:identity.accountId,sessionToken:identity.sessionToken,
  archiveId:identity.archiveId,archiveSha:source.archive.metadata.sha256,
  connectionId:identity.connectionId,connectionRevision:source.connection.revision,
  providerId:source.connection.provider_id,modelId:source.connection.model_id!};
}
export async function previewAiDelivery(db:Client,identity:Identity){
 const source=await authoritative(db,identity.archiveId,identity.connectionId);
 if(!source.ok)return source;
 const approval=createAiPreviewApproval(binding(identity,source));
 return {ok:true as const,preview:source.archive.text,sha256:source.archive.metadata.sha256,
  archiveId:identity.archiveId,connectionId:identity.connectionId,
  provider:source.connection.provider_id,model:source.connection.model_id!,
  cycleId:source.archive.metadata.cycle_id,mode:source.archive.metadata.mode,...approval};
}
export async function sendAiDelivery(db:Client,identity:Identity,approval:unknown){
 const source=await authoritative(db,identity.archiveId,identity.connectionId);
 if(!source.ok)return source;
 if(!consumeAiPreviewApproval(approval,binding(identity,source)))
  return {ok:false as const,error:"approval-expired-or-reused"};
 let secret:Buffer;
 try{secret=await loadAiCredential(identity.connectionId,source.connection.provider_id,source.connection.revision);}
 catch{return {ok:false as const,error:"credential-unavailable"};}
 try{
  // Reserve before the provider call, atomically by connection/day. Missing quota
  // or revoked free status must fail closed (never spend unknown provider credits).
  const quota=await reserveFreeAiRequest(db,identity.connectionId);
  if(!quota.ok)return quota;
  const result=await sendFreeAiPrompt(source.connection.provider_id,source.connection.model_id!,
    source.archive.text,secret);
  // Response only in request memory; no storage in PostgreSQL, file or telemetry.
  return result.ok?{ok:true as const,response:result.text,provider:source.connection.provider_id,
    model:source.connection.model_id!,archiveId:identity.archiveId,stored:false as const}:
    {ok:false as const,error:result.error};
 }finally{secret.fill(0);}
}
