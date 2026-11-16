import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {readFileSync} from "node:fs";
import {createAiPreviewApproval,consumeAiPreviewApproval}
 from "../src/server/ai-connections/preview-approval";
import {buildAiProviderRequest,sendFreeAiPrompt}
 from "../src/server/ai-connections/providers";
import {evaluateFreeModel,freeCatalogSnapshot}
 from "../src/server/ai-connections/free-catalog";
import {auditWindowsDistribution}
 from "../scripts/windows/distribution-package-policy.mjs";

const read=(p:string)=>readFileSync(p,"utf8");
const identity=()=>({accountId:randomUUID(),sessionToken:randomBytes(32).toString("hex"),
 archiveId:randomUUID(),archiveSha:"a".repeat(64),connectionId:randomUUID(),
 connectionRevision:3,providerId:"groq",modelId:"example-model"});

test("SMN-488: each approval is single use, user/session/revision/connection and text bound",()=>{
 const a=identity(),b={...a,connectionId:randomUUID()};
 const now=Date.now();
 const token=createAiPreviewApproval(a,now).approval;
 for(const v of [{...a,accountId:randomUUID()},{...a,sessionToken:"other"},
  {...a,connectionRevision:4},{...a,archiveSha:"f".repeat(64)},b]){
  assert.equal(consumeAiPreviewApproval(token,v,now+100),false);
 }
 assert.equal(consumeAiPreviewApproval(token,a,now+100),true);
 assert.equal(consumeAiPreviewApproval(token,a,now+101),false);
 assert.equal(consumeAiPreviewApproval(createAiPreviewApproval(a,now).approval,a,now+120001),false);
});
test("SMN-488: provider HTTP rejects redirects, timeout, 402, 429 and never retries",async()=>{
 const key=Buffer.from("synthetic-secret-not-a-provider-key");
 const statusCases:[[number,string],...[number,string][]]=[
  [402,"billing-rejected"],[429,"provider-rate-limit"],[503,"provider-unavailable"]];
 for(const [status,error] of statusCases){
  let calls=0;
  const mock=async()=>{calls++;return new Response(null,{status});};
  const result=await sendFreeAiPrompt("groq","fictional/model","synthetic prompt",key,mock as typeof fetch);
  assert.deepEqual(result,{ok:false,error});
  assert.equal(calls,1);
 }
 let redirects=0;
 const redir=await sendFreeAiPrompt("groq","fictional/model","synthetic",key,
  (async(_url:string,init?:RequestInit)=>{
   redirects++;assert.equal(init?.redirect,"manual");
   return new Response(null,{status:307,headers:{location:"https://example.invalid"}});
  }) as typeof fetch);
 assert.deepEqual(redir,{ok:false,error:"provider-redirect-rejected"});
 assert.equal(redirects,1);
 let aborts=0;
 const time=await sendFreeAiPrompt("gemini","fictional-model","synthetic",key,
  (async(_url:string,init?:RequestInit)=>{
   assert.equal(init?.signal instanceof AbortSignal,true);
   aborts++;
   throw Error("synthetic timeout");
  }) as typeof fetch);
 assert.deepEqual(time,{ok:false,error:"provider-network-or-response-error"});
 assert.equal(aborts,1);
 key.fill(0);
});
test("SMN-488: provider requests pin TLS origins, don't route automatically or leak keys into body",()=>{
 for(const provider of ["gemini","groq","openrouter"] as const){
  const request=buildAiProviderRequest(provider,"fictional/model:free",
   "public synthetic input","synthetic-key-only");
  const url=new URL(request.url);
  assert.equal(url.protocol,"https:");
  assert.equal(url.hostname,
   provider==="gemini"?"generativelanguage.googleapis.com":
    provider==="groq"?"api.groq.com":"openrouter.ai");
  assert.equal(request.body.includes("synthetic-key-only"),false);
  assert.equal(request.body.includes("public synthetic input"),true);
  if(provider==="openrouter")assert.equal(JSON.parse(request.body).provider?.allow_fallbacks,false);
 }
});
test("SMN-488: incomplete Free qualification denies all external delivery",()=>{
 assert.equal(freeCatalogSnapshot().requiresManualQualification,true);
 assert.deepEqual(freeCatalogSnapshot().qualified,[]);
 for(const model of freeCatalogSnapshot().candidates)
  assert.equal(evaluateFreeModel(model.providerId,model.modelId).allowed,false);
});
test("SMN-488: explicit save is the only persistence path, never API send or retry",()=>{
 const ui=read("src/app/app/admin/ai-briefs/prepare/brief-ai-send-panel.tsx");
 const send=ui.split("async function send(){")[1]?.split("async function copy(){")[0]??"";
 const save=ui.split("async function saveResponse(){")[1]?.split("function discard(){")[0]??"";
 assert.ok(send.length>100&&save.length>100);
 assert.doesNotMatch(send,/\/api\/ai-briefs\/archives\/|saveResponse\(|localStorage|sessionStorage/);
 assert.match(save,/method:"POST"/);
 assert.match(save,/idempotencyKey:responseKey/);
 assert.match(ui,/onClick=\{\(\)=>void saveResponse\(\)\}/);
 assert.match(ui,/setConsent\(false\)/);
 const service=read("src/server/ai-briefs/responses.ts");
 assert.match(service,/ON CONFLICT \(id\) DO NOTHING/);
 assert.match(service,/author_id=\$4/);
});
test("SMN-488: API auth and origin controls, no secrets in responses or trace logs",()=>{
 const files=["route.ts","credentials/route.ts","preview/route.ts","send/route.ts",
 "test/route.ts","reset-vault/route.ts"].map(x=>
  "src/app/api/admin/ai-connections/"+x);
 for(const file of files){
  const code=read(file);
  assert.match(code,/authorizeApi\(/,file);
  assert.match(code,/allowMutation\(/,file);
  assert.doesNotMatch(code,/console\.(log|error|warn)\(/,file);
 }
 const delivery=read("src/server/ai-connections/delivery.ts");
 assert.match(delivery,/stored:false/);
 assert.doesNotMatch(delivery,/INSERT INTO|saveManualAiResponse|console\./);
 const db=read("prisma/migrations/20261116_smn480_ai_connections/migration.sql");
 assert.doesNotMatch(db,/(?:api_key|master_key|secret|access_token)\s+(?:text|varchar|bytea)\b/i);
});
test("SMN-488: Scrum/Kanban TXT and translations remain available",()=>{
 const editor=read("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx");
 assert.match(editor,/BriefAiSendPanel/);
 const delivery=read("src/server/ai-connections/delivery.ts");
 assert.match(delivery,/lower\(i\.mode\) IN \('scrum','kanban'\)/);
 for(const file of ["src/i18n/ai-connections.fr.json","src/i18n/ai-connections.en.json"]){
  const data=JSON.parse(read(file));
  assert.ok(data.aiSend?.consent&&data.aiSend?.saveResponse);
  assert.ok(data.aiConnections?.statusMissing);
 }
});
test("SMN-488: distribution rejects master key or encrypted vault at any depth",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn488-dist-"));
 try{
  for(const dir of ["app","runtime/node","data/documents","data/tickets","updates"])
   await mkdir(join(root,dir),{recursive:true});
  await writeFile(join(root,"Demarrer SMN.bat"),
   "@echo off\r\n.\\runtime\\node\\node.exe .\\runtime\\launcher.mjs\r\n");
  await writeFile(join(root,"runtime/node/node.exe"),"fake");
  await writeFile(join(root,"runtime/launcher.mjs"),"fake");
  await writeFile(join(root,"app/server.js"),"fake");
  await writeFile(join(root,"app/distribution-version.json"),"{}");
  await auditWindowsDistribution(root);
  await mkdir(join(root,"data","ai-secrets"));
  await assert.rejects(auditWindowsDistribution(root),/distribution-ai-secrets-forbidden/);
  await rm(join(root,"data","ai-secrets"),{recursive:true});
  await writeFile(join(root,"app",".vault-master-v1"),"fake");
  await assert.rejects(auditWindowsDistribution(root),/distribution-ai-secrets-forbidden/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("SMN-488: SMN-442 source and restored migrations remain fail-closed",()=>{
 const backup=read("src/server/backup/portable-ai-connections.ts");
 const cutover=read("src/server/backup/fresh-install-cutover.ts");
 const postcheck=read("scripts/smn-40-cutover-postcheck.ts");
 const exportCode=read("src/app/api/admin/backups/migration/export/route.ts");
 assert.match(exportCode,/inspectPortableAiTransfer/);
 assert.match(cutover,/assertOnlyAiConnectionChanged/);
 assert.match(cutover,/quarantineRestoredAiConnections/);
 assert.match(postcheck,/verifyAiQuarantineEvidence/);
 assert.match(backup,/credential_state='missing'/);
 assert.doesNotMatch(backup,/DELETE FROM public\.smn_ai_brief_archive/);
 const packagePolicy=read("scripts/windows/distribution-package-policy.mjs");
 assert.match(packagePolicy,/distribution-ai-secrets-forbidden/);
});
