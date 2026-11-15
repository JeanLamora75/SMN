import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {validatePromptModelDraft,PROMPT_TEXT_LIMIT} from "../src/lib/ai-brief-prompt-model";
import {manageBriefTemplate} from "../src/server/ai-briefs/templates";

const source=(path:string)=>readFileSync(path,"utf8");
const valid={title:"Bilan",description:"",promptText:"Analyse {{SPRINT_NAME}}.\nRisques :\n{{ROW:RISKS}}"};

function database(revision=2,hasPrompt=true){
 const sql:string[]=[];
 const params:unknown[][]=[];
 const db={query:async (q:string,p:unknown[]=[])=>{
  sql.push(q);params.push(p);
  if(q.includes("FROM public.smn_installation"))return{rows:[{id:"singleton"}]};
  if(q.includes("FROM pg_class"))return{rows:[{name:"smn_ai_brief_template"}]};
  if(q.includes("information_schema.columns"))return{rows:[{present:hasPrompt}]};
  if(q.includes("SELECT revision FROM"))return{rows:[{revision}]};
  return{rows:[]};
 }} as unknown as Client;
 return {db,sql,params};
}

test("a free-text model requires only a name and prompt",()=>{
 assert.equal(validatePromptModelDraft(valid),true);
 assert.equal(validatePromptModelDraft({...valid,description:"optional"}),true);
 assert.equal(validatePromptModelDraft({...valid,promptText:"  "}),false);
 assert.equal(validatePromptModelDraft({...valid,title:" "}),false);
 assert.equal(validatePromptModelDraft({...valid,promptText:"x".repeat(PROMPT_TEXT_LIMIT+1)}),false);
});

test("creating a prompt writes prompt_text and keeps legacy columns valid",async()=>{
 const {db,sql,params}=database();
 const result=await manageBriefTemplate(db,"author",{action:"create",template:valid});
 assert.equal(result.ok,true);
 const i=sql.findIndex(q=>q.includes("INSERT INTO public.smn_ai_brief_template"));
 assert.ok(i>=0);
 assert.match(sql[i],/prompt_text/);
 assert.ok(sql[i].includes('["Prompt libre"]')); // Legacy non-null placeholder remains until cutover.
 assert.equal(params[i][3],valid.promptText);
 assert.ok(sql.includes("COMMIT"));
 assert.ok(!sql.some(q=>/DROP COLUMN|DELETE FROM/.test(q)));
});

test("updating a prompt checks revision and does not overwrite legacy JSON",async()=>{
 const id="f9e1f883-533f-4145-bcad-7834cb7a7644";
 const {db,sql,params}=database(2);
 const result=await manageBriefTemplate(db,"author",{action:"update",id,revision:2,template:valid});
 assert.deepEqual(result,{ok:true,id,revision:3});
 const i=sql.findIndex(q=>q.includes("UPDATE public.smn_ai_brief_template SET title"));
 assert.ok(i>=0);
 assert.ok(sql[i].includes("prompt_text=$4"));
 assert.doesNotMatch(sql[i],/sections=|questions=|instructions=|data=|depth=/);
 assert.deepEqual(params[i],[id,"Bilan","",valid.promptText]);
});

test("revision conflict rolls back without changing the saved prompt",async()=>{
 const {db,sql}=database(5);
 const result=await manageBriefTemplate(db,"author",{
  action:"update",id:"f9e1f883-533f-4145-bcad-7834cb7a7644",revision:4,template:valid
 });
 assert.deepEqual(result,{ok:false,error:"conflict"});
 assert.ok(sql.includes("ROLLBACK"));
 assert.ok(!sql.some(q=>q.includes("SET title")));
});

test("a new free-text model cannot be written on an un-migrated database",async()=>{
 const {db,sql}=database(2,false);
 const result=await manageBriefTemplate(db,"author",{action:"create",template:valid});
 assert.deepEqual(result,{ok:false,error:"schema-upgrade-required"});
 assert.ok(sql.includes("ROLLBACK"));
 assert.ok(!sql.some(q=>q.includes("INSERT INTO public.smn_ai_brief_template")));
});

test("protected native models cannot be mutated by identifier",async()=>{
 const {db,sql}=database();
 const result=await manageBriefTemplate(db,"author",{action:"deactivate",id:"cycle-review",revision:0});
 assert.deepEqual(result,{ok:false,error:"protected"});
 assert.equal(sql.length,0);
});

test("template page exposes a single text notepad, unsaved warning and no technical inputs",()=>{
 const editor=source("src/app/app/admin/ai-briefs/templates/template-editor.tsx");
 const page=source("src/app/app/admin/ai-briefs/templates/page.tsx");
 const api=source("src/app/api/admin/ai-briefs/templates/route.ts");
 assert.match(editor,/id="brief-template-prompt"/);
 assert.match(editor,/useUnsavedChanges\(dirty\|\|busy/);
 assert.match(editor,/current\?\.builtin/);
 assert.match(editor,/selected===model.id/);
 assert.match(editor,/validatePromptModelDraft\(draft\)/);
 assert.doesNotMatch(editor,/brief-depth|brief-sections|brief-questions|brief-instructions|brief-data/);
 assert.match(page,/SettingsPageShell/);
 assert.match(page,/canAccess\(account,"write"/);
 assert.match(api,/authorizeApi\(req,"write",scope\)/);
 assert.match(api,/readJsonObject\(req,900000\)/);
 const preparation=source("src/app/app/admin/ai-briefs/prepare/page.tsx");
 assert.match(preparation,/newFormatOnly/);
 assert.match(preparation,/item\.sections\[0\]==="Prompt libre"/);
 assert.match(preparation,/t\.active&&!newFormatOnly\(t\)/);
});

test("labels cover the same strings in French and English",()=>{
 const fr=JSON.parse(source("src/i18n/fr.json")).briefPromptEditor;
 const en=JSON.parse(source("src/i18n/en.json")).briefPromptEditor;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of Object.keys(fr))assert.ok(typeof fr[key]==="string"&&fr[key].length&&typeof en[key]==="string"&&en[key].length);
});
