import {createHash,createHmac,randomBytes,timingSafeEqual} from "node:crypto";

/** Ephemeral process-local, one-use approvals. On restart / another process, fail closed.
 * We do not persist prompts, approval tokens, or API answers.
 */
type Payload={version:1;accountId:string;sessionHash:string;archiveId:string;archiveSha:string;
 connectionId:string;connectionRevision:number;providerId:string;modelId:string;
 expiresAt:number;nonce:string};
type Entry={expiresAt:number;state:"pending"|"used"};
const state=globalThis as typeof globalThis&{__smnAiApproval?:{key:Buffer;tokens:Map<string,Entry>}};
function store(){return state.__smnAiApproval??={key:randomBytes(32),tokens:new Map()};}
const digest=(data:string)=>createHash("sha256").update(data).digest("hex");
const encode=(p:Payload)=>Buffer.from(JSON.stringify(p)).toString("base64url");
const mac=(key:Buffer,body:string)=>createHmac("sha256",key).update(body).digest("base64url");
const same=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
export type ApprovalBinding=Omit<Payload,"version"|"expiresAt"|"nonce"|"sessionHash">&{sessionToken:string};
export function createAiPreviewApproval(binding:ApprovalBinding,at=Date.now()){
 const s=store();
 for(const [id,entry] of s.tokens){if(entry.expiresAt<at||entry.state==="used")s.tokens.delete(id);}
 if(s.tokens.size>=150)throw Error("ai-preview-capacity");
 const payload:Payload={version:1,accountId:binding.accountId,sessionHash:digest(binding.sessionToken),
  archiveId:binding.archiveId,archiveSha:binding.archiveSha,
  connectionId:binding.connectionId,connectionRevision:binding.connectionRevision,
  providerId:binding.providerId,modelId:binding.modelId,expiresAt:at+120000,
  nonce:randomBytes(16).toString("hex")};
 const body=encode(payload);
 s.tokens.set(payload.nonce,{expiresAt:payload.expiresAt,state:"pending"});
 return {approval:body+"."+mac(s.key,body),expiresAt:new Date(payload.expiresAt).toISOString()};
}
/** Mark consumed before any asynchronous provider work to reject double clicks. */
export function consumeAiPreviewApproval(token:unknown,binding:ApprovalBinding,at=Date.now()){
 if(typeof token!=="string"||token.length>4096)return false;
 const parts=token.split(".");
 if(parts.length!==2)return false;
 const s=store();
 if(!same(mac(s.key,parts[0]),parts[1]))return false;
 let p:Payload;
 try{p=JSON.parse(Buffer.from(parts[0],"base64url").toString("utf8")) as Payload;}
 catch{return false;}
 if(!p||p.version!==1||typeof p.nonce!=="string"||p.expiresAt<=at||
    p.expiresAt>at+120000||p.accountId!==binding.accountId||
    p.sessionHash!==digest(binding.sessionToken)||p.archiveId!==binding.archiveId||
    p.archiveSha!==binding.archiveSha||p.connectionId!==binding.connectionId||
    p.connectionRevision!==binding.connectionRevision||p.providerId!==binding.providerId||
    p.modelId!==binding.modelId)return false;
 const entry=s.tokens.get(p.nonce);
 if(!entry||entry.state!=="pending"||entry.expiresAt!==p.expiresAt)return false;
 entry.state="used";s.tokens.delete(p.nonce);return true;
}
