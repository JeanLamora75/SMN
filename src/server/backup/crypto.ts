import {createCipheriv,createDecipheriv,randomBytes,scryptSync} from "node:crypto";

export type Sealed=Readonly<{nonce:string;tag:string;ciphertext:Buffer}>;
export type RecoveryEnvelope=Readonly<{
 version:1;kdf:"scrypt";salt:string;nonce:string;tag:string;wrappedKey:string;
}>;

export function seal(key:Buffer,content:Buffer):Sealed{
 if(key.length!==32)throw new Error("backup-key-invalid");
 const iv=randomBytes(12);
 const cipher=createCipheriv("aes-256-gcm",key,iv);
 const ciphertext=Buffer.concat([cipher.update(content),cipher.final()]);
 return {nonce:iv.toString("hex"),tag:cipher.getAuthTag().toString("hex"),ciphertext};
}
export function unseal(key:Buffer,packageData:Sealed):Buffer{
 if(key.length!==32)throw new Error("backup-key-invalid");
 const cipher=createDecipheriv("aes-256-gcm",key,Buffer.from(packageData.nonce,"hex"));
 cipher.setAuthTag(Buffer.from(packageData.tag,"hex"));
 return Buffer.concat([cipher.update(packageData.ciphertext),cipher.final()]);
}
export function wrapRecoveryKey(key:Buffer,phrase:string):RecoveryEnvelope{
 if(typeof phrase!=="string"||phrase.length<20||phrase.length>256||phrase.trim()!==phrase||
 phrase.includes("\n")||phrase.includes("\r")||key.length!==32)
 throw new Error("backup-recovery-phrase-invalid");
 const salt=randomBytes(16);
 const wrappingKey=scryptSync(phrase,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 try{
  const wrapped=seal(wrappingKey,key);
  return {version:1,kdf:"scrypt",salt:salt.toString("hex"),
   nonce:wrapped.nonce,tag:wrapped.tag,wrappedKey:wrapped.ciphertext.toString("hex")};
 }finally{wrappingKey.fill(0);}
}
export function recoverKey(envelope:RecoveryEnvelope,phrase:string):Buffer{
 if(envelope.version!==1||envelope.kdf!=="scrypt"||
 !/^[0-9a-f]{32}$/.test(envelope.salt)||!/^[0-9a-f]{24}$/.test(envelope.nonce)||
 !/^[0-9a-f]{32}$/.test(envelope.tag)||!/^[0-9a-f]{64}$/.test(envelope.wrappedKey))
 throw new Error("backup-recovery-invalid");
 const key=scryptSync(phrase,Buffer.from(envelope.salt,"hex"),32,
 {N:32768,r:8,p:1,maxmem:64*1024*1024});
 try{
  const result=unseal(key,{nonce:envelope.nonce,tag:envelope.tag,
   ciphertext:Buffer.from(envelope.wrappedKey,"hex")});
  if(result.length!==32)throw new Error("backup-recovery-invalid");
  return result;
 }finally{key.fill(0);}
}
