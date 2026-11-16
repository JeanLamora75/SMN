import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {saveManualAiResponse,validManualAiResponse} from "../src/server/ai-briefs/responses";

const read=(path:string)=>readFileSync(path,"utf8");
const archiveId=randomUUID(),teamId="team-1",userId="admin-1";
const txt=Buffer.from("Immutable test archive: no sprint or client data","utf8");
const digest=createHash("sha256").update(txt).digest("hex");
const saved=new Map<string,{id:string;archiveId:string;teamId:string;userId:string;text:string;provider:string|null;model:string|null}>();
let inserts=0,commits=0,rollbacks=0;
const fakeDb={query:async(sql:string,args:unknown[]=[])=>{
 if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK"){
  if(sql==="COMMIT")commits++;
  if(sql==="ROLLBACK")rollbacks++;
  return {rows:[],rowCount:0};
 }
 if(sql.includes("to_regclass('public.smn_ai_brief_archive')"))return {rows:[{present:true}]};
 if(sql.includes("information_schema.columns")&&sql.includes("parent_archive_id"))
  return {rows:[{present:true}]};
 if(sql.includes("FROM public.smn_ai_brief_archive a WHERE a.id="))
  return {rows:[{id:archiveId,mode:"scrum",cycle_id:"cycle-1",team_id:teamId,
   template_id:"cycle-review",template_revision:1,created_at:"2026-11-16",sha256:digest,
   byte_length:txt.length,author_id:userId,parent_archive_id:null,content:txt}]};
 if(sql.includes("FROM pg_class"))return {rows:[{name:"smn_ai_brief_response"}]};
 if(sql.includes("INSERT INTO public.smn_ai_brief_response")){
  const [id,archive,team,author,text,provider,model]=args as string[];
  if(saved.has(id))return {rows:[],rowCount:0};
  saved.set(id,{id,archiveId:archive,teamId:team,userId:author,text,provider,model});
  inserts++;return {rows:[{id}],rowCount:1};
 }
 if(sql.includes("SELECT id::text FROM public.smn_ai_brief_response")){
  const [id,archive,team,author,text,provider,model]=args as string[];
  const row=saved.get(id);
  return {rows:row&&row.archiveId===archive&&row.teamId===team&&
   row.userId===author&&row.text===text&&row.provider===provider&&row.model===model
   ?[{id}]:[],rowCount:1};
 }
 throw Error("Unexpected SQL: "+sql);
}} as unknown as Client;

test("SMN-486 optional UUID is validated before PostgreSQL writes",()=>{
 assert.equal(validManualAiResponse({text:"OK",idempotencyKey:"bad"}),false);
 assert.equal(validManualAiResponse({text:"OK",idempotencyKey:randomUUID()}),true);
 assert.equal(validManualAiResponse({text:""}),false);
});
test("SMN-486 first explicit save commits; replay returns same id without duplicate",async()=>{
 const id=randomUUID(),payload={text:"AI answer generated only for test",provider:"groq",model:"model",idempotencyKey:id};
 const first=await saveManualAiResponse(fakeDb,archiveId,teamId,userId,payload);
 const retry=await saveManualAiResponse(fakeDb,archiveId,teamId,userId,payload);
 assert.deepEqual(first,{ok:true,id,alreadySaved:false});
 assert.deepEqual(retry,{ok:true,id,alreadySaved:true});
 assert.equal(inserts,1);assert.equal(commits,2);assert.equal(saved.get(id)?.text,payload.text);
 assert.equal(txt.toString(),"Immutable test archive: no sprint or client data");
 const forged=await saveManualAiResponse(fakeDb,archiveId,teamId,userId,{
  ...payload,text:"different response"});
 assert.deepEqual(forged,{ok:false,error:"idempotency-conflict"});
 assert.equal(inserts,1);assert.ok(rollbacks>=1);
});
test("SMN-486 UI only persists when Save response is deliberately clicked",()=>{
 const ui=read("src/app/app/admin/ai-briefs/prepare/brief-ai-send-panel.tsx");
 const route=read("src/app/api/ai-briefs/archives/[id]/responses/route.ts");
 const service=read("src/server/ai-briefs/responses.ts");
 assert.match(ui,/onClick=\{\(\)=>void saveResponse\(\)\}/);
 assert.match(ui,/if\(!answer\|\|!responseKey\|\|busy\.current\|\|savedId\|\|saving\)return/);
 assert.match(ui,/idempotencyKey:responseKey/);
 assert.match(ui,/setSavedId\(result\.id\)/);
 assert.match(ui,/window\.addEventListener\("beforeunload"/);
 assert.match(ui,/onClick=\{confirmLeaving\}/);
 assert.match(ui,/setResponseKey\(crypto\.randomUUID\(\)\)/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage|indexedDB|useEffect\(\(\)=>\{void saveResponse/);
 assert.match(route,/allowMutation\(req\)/);
 assert.match(route,/authorizeApi\(req,"write"/);
 assert.match(service,/ON CONFLICT \(id\) DO NOTHING RETURNING id::text/);
 assert.match(service,/author_id=\$4/);
 assert.match(service,/AND deleted_at IS NULL/);
});
test("SMN-486 FR and EN messages are complete",()=>{
 const fr=JSON.parse(read("src/i18n/ai-connections.fr.json")).aiSend as Record<string,string>;
 const en=JSON.parse(read("src/i18n/ai-connections.en.json")).aiSend as Record<string,string>;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of ["saveResponse","saving","saved","alreadySaved","saveConflict","saveFailed","leaveConfirm"]){
  assert.ok(fr[key]?.length>5);assert.ok(en[key]?.length>5);
 }
});
