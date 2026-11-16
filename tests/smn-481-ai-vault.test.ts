import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {encryptAiKey,decryptAiKey} from "../src/server/ai-connections/crypto";
const read=(path:string)=>readFileSync(path,"utf8");
test("SMN-481 authenticates identity, provider and revision with AES-GCM",()=>{
 const key=randomBytes(32),plain=Buffer.from("test-key-only-not-real");
 const id=randomUUID(),other=randomUUID(),encrypted=encryptAiKey(key,id,"groq",2,plain);
 assert.equal(decryptAiKey(key,encrypted,id,"groq",2).toString(),plain.toString());
 assert.throws(()=>decryptAiKey(key,encrypted,other,"groq",2));
 assert.throws(()=>decryptAiKey(key,encrypted,id,"gemini",2));
 assert.throws(()=>decryptAiKey(key,encrypted,id,"groq",3));
 assert.throws(()=>decryptAiKey(randomBytes(32),encrypted,id,"groq",2));
 assert.throws(()=>decryptAiKey(key,{...encrypted,tag:"0".repeat(32)},id,"groq",2));
 assert.notEqual(encrypted.ciphertext,plain.toString("hex"));
 const next=encryptAiKey(key,id,"groq",2,plain);
 assert.notEqual(next.nonce,encrypted.nonce);
 key.fill(0);plain.fill(0);
});
test("SMN-481 requires admin origin and never returns plaintext",()=>{
 const route=read("src/app/api/admin/ai-connections/credentials/route.ts");
 assert.match(route,/allowMutation\(req\)/);
 assert.match(route,/authorizeApi\(req,"write",scope\)/);
 assert.doesNotMatch(route,/return jsonResult\(\{.*key/);
 const service=read("src/server/ai-connections/credentials.ts");
 assert.match(service,/FOR UPDATE/);
 assert.match(service,/enabled=false/);
 assert.match(service,/revision=revision\+1/);
 assert.match(service,/purgeAiCredentialVersions/);
});
test("SMN-481 dedicated vault stays outside backup components",()=>{
 const vault=read("src/server/ai-connections/vault.ts");
 assert.match(vault,/data","ai-secrets/);
 assert.match(vault,/open\(keyPath,"wx",0o600\)/);
 assert.match(vault,/writeExclusive/);
 assert.match(vault,/isSymbolicLink/);
 assert.match(vault,/\.enc/);
 const portable=read("src/server/backup/portable-package.ts");
 assert.doesNotMatch(portable,/ai-secrets|ai-vault/);
 const zip=read("src/server/backup/portable-transfer-zip.ts");
 assert.doesNotMatch(zip,/ai-secrets|ai-vault/);
});

test("SMN-481 multiple connections use different authenticated envelopes",()=>{
 const master=randomBytes(32),first=randomUUID(),second=randomUUID();
 const plaintext=Buffer.from("synthetic-credential-only","utf8");
 try{
  const a=encryptAiKey(master,first,"groq",1,plaintext);
  const b=encryptAiKey(master,second,"groq",1,plaintext);
  assert.notEqual(a.nonce,b.nonce);
  assert.notEqual(a.ciphertext,b.ciphertext);
  assert.equal(decryptAiKey(master,a,first,"groq",1).toString(),plaintext.toString());
  assert.equal(decryptAiKey(master,b,second,"groq",1).toString(),plaintext.toString());
  assert.throws(()=>decryptAiKey(master,a,second,"groq",1),/ai-secret-unavailable/);
  assert.throws(()=>decryptAiKey(master,b,first,"groq",1),/ai-secret-unavailable/);
  for(const [name,modified] of [
   ["nonce",{...a,nonce:"0".repeat(24)}],
   ["ciphertext",{...a,ciphertext:"0".repeat(a.ciphertext.length)}],
   ["provider",{...a,providerId:"gemini"}],
   ["version",{...a,version:2}]
  ] as const){
   assert.throws(()=>decryptAiKey(master,modified,first,"groq",1),/ai-secret-unavailable/,name);
  }
  assert.doesNotMatch(JSON.stringify(a),/synthetic-credential-only/);
  assert.doesNotMatch(JSON.stringify(b),/synthetic-credential-only/);
 }finally{master.fill(0);plaintext.fill(0);}
});

test("SMN-481 invalid plaintext or master lengths fail without producing an envelope",()=>{
 const id=randomUUID(),key=randomBytes(32);
 try{
  for(const candidate of [Buffer.from("short"),Buffer.alloc(8193,65)]){
   assert.throws(()=>encryptAiKey(key,id,"groq",1,candidate),/ai-secret-invalid/);
  }
  assert.throws(()=>encryptAiKey(Buffer.alloc(31),id,"groq",1,Buffer.from("synthetic-key")),/ai-secret-invalid/);
  assert.throws(()=>encryptAiKey(key,id,"unknown",1,Buffer.from("synthetic-key")),/ai-secret-invalid/);
  assert.throws(()=>encryptAiKey(key,id,"groq",0,Buffer.from("synthetic-key")),/ai-secret-invalid/);
 }finally{key.fill(0);}
});
