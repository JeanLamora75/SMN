import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {createAiPreviewApproval,consumeAiPreviewApproval} from "../src/server/ai-connections/preview-approval";
import {buildAiProviderRequest,sendFreeAiPrompt} from "../src/server/ai-connections/providers";
import {evaluateFreeModel} from "../src/server/ai-connections/free-catalog";
const read=(path:string)=>readFileSync(path,"utf8");
test("SMN-484 preview is bound to exact reviewed snapshot, user and session; only once",()=>{
 const original={accountId:"admin-A",sessionToken:"session-A",archiveId:randomUUID(),
  archiveSha:"a".repeat(64),connectionId:randomUUID(),connectionRevision:7,
  providerId:"groq",modelId:"model-free"};
 const {approval,expiresAt}=createAiPreviewApproval(original,1700000000000);
 assert.equal(expiresAt,"2023-11-14T22:15:20.000Z");
 assert.equal(consumeAiPreviewApproval(approval,{...original,archiveSha:"b".repeat(64)},1700000001000),false);
 assert.equal(consumeAiPreviewApproval(approval,{...original,sessionToken:"session-B"},1700000001000),false);
 assert.equal(consumeAiPreviewApproval(approval,{...original,modelId:"other-model"},1700000001000),false);
 assert.equal(consumeAiPreviewApproval(approval,original,1700000001000),true);
 assert.equal(consumeAiPreviewApproval(approval,original,1700000001000),false);
 const expired=createAiPreviewApproval(original,1700000000000);
 assert.equal(consumeAiPreviewApproval(expired.approval,original,1700000120000),false);
});
test("SMN-484 only fixed TLS endpoints, no redirect or fallback",()=>{
 const g=buildAiProviderRequest("gemini","gemini-2.5-flash-lite","synthetic text","dummy-secret");
 const q=buildAiProviderRequest("groq","openai/gpt-oss-20b","synthetic text","dummy-secret");
 const o=buildAiProviderRequest("openrouter","example/model:free","synthetic text","dummy-secret");
 assert.match(g.url,/^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\//);
 assert.match(q.url,/^https:\/\/api\.groq\.com\/openai\/v1\/chat\/completions$/);
 assert.match(o.url,/^https:\/\/openrouter\.ai\/api\/v1\/chat\/completions$/);
 assert.equal(JSON.parse(o.body).provider.allow_fallbacks,false);
 assert.equal(JSON.parse(g.body).contents[0].parts[0].text,"synthetic text");
 assert.equal(JSON.parse(q.body).messages[0].content,"synthetic text");
 assert.throws(()=>buildAiProviderRequest("openrouter","https://evil.example","text","key"));
});
test("SMN-484 provider parsing only returns response in memory and never follows redirects",async()=>{
 let calls=0;
 const fake=async (_url:string,init?:RequestInit)=>{
  calls++;assert.equal(init?.method,"POST");assert.equal(init?.redirect,"manual");
  return new Response(JSON.stringify({choices:[{message:{content:"A short answer."}}]}),{
   status:200,headers:{"content-type":"application/json"}});
 };
 const secret=Buffer.from("dummy-secret");
 const answer=await sendFreeAiPrompt("groq","test-free","only fictional test prompt",secret,fake as typeof fetch);
 assert.deepEqual(answer,{ok:true,text:"A short answer."});
 assert.equal(calls,1);
 const redirected=await sendFreeAiPrompt("groq","test-free","fictional",secret,
  (async()=>new Response(null,{status:302,headers:{location:"https://evil.example"}})) as typeof fetch);
 assert.deepEqual(redirected,{ok:false,error:"provider-redirect-rejected"});
 const tooLarge=await sendFreeAiPrompt("groq","test-free","fictional",secret,
  (async()=>new Response("x".repeat(250001),{status:200,headers:{"content-type":"application/json"}})) as typeof fetch);
 assert.equal(tooLarge.ok,false);
});
test("SMN-484 is blocked without account-qualified free models",()=>{
 assert.equal(evaluateFreeModel("gemini","gemini-2.5-flash-lite").allowed,false);
 assert.equal(evaluateFreeModel("groq","openai/gpt-oss-20b").allowed,false);
 assert.equal(evaluateFreeModel("openrouter","inclusionai/ling-3.2-flash:free").allowed,false);
 const preview=read("src/app/api/admin/ai-connections/preview/route.ts");
 const send=read("src/app/api/admin/ai-connections/send/route.ts");
 const delivery=read("src/server/ai-connections/delivery.ts");
 for(const route of [preview,send]){
  assert.match(route,/authorizeApi\(req,"write"/);
  assert.match(route,/allowMutation\(req\)/);
  assert.doesNotMatch(route,/console\.|localStorage|sessionStorage/);
 }
 assert.match(delivery,/readPrivateBriefArchive/);
 assert.match(delivery,/evaluateFreeModel/);
 assert.match(delivery,/reserveFreeAiRequest/);
 assert.match(delivery,/loadAiCredential/);
 assert.match(read("src/server/ai-connections/connection-test.ts"),/anonymous SMN API connectivity test/);
 assert.doesNotMatch(delivery,/INSERT INTO public\.smn_ai_brief_response|saveManualAiResponse/);
 assert.match(delivery,/stored:false/); // result is emitted from volatile delivery
});

test("SMN-484 provider test cannot invalidate revision-bound encrypted keys",()=>{
 const probe=read("src/server/ai-connections/connection-test.ts");
 assert.match(probe,/testAiConnection/);
 assert.match(probe,/loadAiCredential\(id,row\.provider_id,row\.revision\)/);
 assert.doesNotMatch(probe,/revision=revision\+1/);
 assert.match(probe,/tested:true,revision\}/);
});

test("SMN-484 Gemini, Groq and OpenRouter response schemas are parsed distinctly",async()=>{
 const key=Buffer.from("not-an-api-key");
 const fixtures=[
  {provider:"gemini" as const,body:{candidates:[{content:{parts:[{text:"Part A"},{text:" Part B"}]}}]},expected:"Part A Part B"},
  {provider:"groq" as const,body:{choices:[{message:{content:"Groq result"}}]},expected:"Groq result"},
  {provider:"openrouter" as const,body:{choices:[{message:{content:"Router result"}}]},expected:"Router result"}
 ];
 for(const item of fixtures){
  let count=0;
  const fake=async()=>{
   count++;
   return new Response(JSON.stringify(item.body),{
    status:200,headers:{"content-type":"application/json;charset=utf-8"}});
  };
  const response=await sendFreeAiPrompt(item.provider,"synthetic/model","public sample",key,fake as typeof fetch);
  assert.deepEqual(response,{ok:true,text:item.expected});
  assert.equal(count,1);
 }
 key.fill(0);
});

test("SMN-484 malformed provider response, wrong MIME and quota never return text",async()=>{
 const key=Buffer.from("synthetic-secret");
 const scenarios=[
  {body:"not json",contentType:"application/json"},
  {body:JSON.stringify({choices:[]}),contentType:"application/json"},
  {body:JSON.stringify({choices:[{message:{content:"  "}}]}),contentType:"application/json"},
  {body:JSON.stringify({choices:[{message:{content:"secret"}}]}),contentType:"text/plain"},
  {body:JSON.stringify({choices:[{message:{content:"x".repeat(250001)}}]}),contentType:"application/json"}
 ];
 for(const fixture of scenarios){
  let calls=0;
  const fake=async()=>{
   calls++;
   return new Response(fixture.body,{status:200,headers:{"content-type":fixture.contentType}});
  };
  const response=await sendFreeAiPrompt("groq","synthetic/model","public sample",key,fake as typeof fetch);
  assert.equal(response.ok,false);
  assert.equal(calls,1);
  assert.doesNotMatch(JSON.stringify(response),/synthetic-secret/);
 }
 key.fill(0);
});

test("SMN-484 consent token binds full destination and cannot be renewed by tampering",()=>{
 const identity={accountId:randomUUID(),sessionToken:"synthetic-session-only",
  archiveId:randomUUID(),archiveSha:"f".repeat(64),
  connectionId:randomUUID(),connectionRevision:5,providerId:"gemini",modelId:"model-test"};
 const at=1700000000000;
 const token=createAiPreviewApproval(identity,at).approval;
 const pieces=token.split(".");
 assert.equal(pieces.length,2);
 const altered=pieces[0].slice(0,-1)+(pieces[0].endsWith("A")?"B":"A")+"."+pieces[1];
 assert.equal(consumeAiPreviewApproval(altered,identity,at+1),false);
 assert.equal(consumeAiPreviewApproval(token,{...identity,providerId:"groq"},at+1),false);
 assert.equal(consumeAiPreviewApproval(token,{...identity,archiveId:randomUUID()},at+1),false);
 assert.equal(consumeAiPreviewApproval(token,identity,at+1),true);
 assert.equal(consumeAiPreviewApproval(token,identity,at+2),false);
});
