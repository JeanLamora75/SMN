import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";

/** Portable AES-256-GCM envelope. Metadata is authenticated, never plaintext. */
export type AiEnvelope=Readonly<{
 version:1;connectionId:string;providerId:string;revision:number;
 nonce:string;tag:string;ciphertext:string;
}>;
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVIDERS=new Set(["gemini","groq","openrouter"]);
const aad=(id:string,provider:string,revision:number)=>
 Buffer.from(`SMN-AI-VAULT:1:${id}:${provider}:${revision}`,"utf8");
function validIdentity(id:string,provider:string,revision:number){
 return ID.test(id)&&PROVIDERS.has(provider)&&Number.isSafeInteger(revision)&&revision>0;
}
export function encryptAiKey(master:Buffer,id:string,provider:string,revision:number,secret:Buffer):AiEnvelope{
 if(master.length!==32||!validIdentity(id,provider,revision)||secret.length<8||secret.length>8192)
  throw Error("ai-secret-invalid");
 const nonce=randomBytes(12);
 const cipher=createCipheriv("aes-256-gcm",master,nonce);
 cipher.setAAD(aad(id,provider,revision));
 const ciphertext=Buffer.concat([cipher.update(secret),cipher.final()]);
 return {version:1,connectionId:id,providerId:provider,revision,
  nonce:nonce.toString("hex"),tag:cipher.getAuthTag().toString("hex"),
  ciphertext:ciphertext.toString("hex")};
}
export function decryptAiKey(master:Buffer,raw:unknown,id:string,provider:string,revision:number):Buffer{
 const x=raw as Partial<AiEnvelope>|null;
 if(master.length!==32||!validIdentity(id,provider,revision)||
  !x||x.version!==1||x.connectionId!==id||x.providerId!==provider||
  x.revision!==revision||typeof x.nonce!=="string"||!/^[a-f0-9]{24}$/.test(x.nonce)||
  typeof x.tag!=="string"||!/^[a-f0-9]{32}$/.test(x.tag)||
  typeof x.ciphertext!=="string"||!/^([a-f0-9]{2}){8,8192}$/.test(x.ciphertext))
  throw Error("ai-secret-unavailable");
 try{
  const decipher=createDecipheriv("aes-256-gcm",master,Buffer.from(x.nonce,"hex"));
  decipher.setAAD(aad(id,provider,revision));
  decipher.setAuthTag(Buffer.from(x.tag,"hex"));
  return Buffer.concat([decipher.update(Buffer.from(x.ciphertext,"hex")),decipher.final()]);
 }catch{throw Error("ai-secret-unavailable");}
}
