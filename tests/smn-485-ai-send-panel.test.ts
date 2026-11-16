import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
test("SMN-485 is integrated after explicit finalized and reviewed TXT",()=>{
 const editor=read("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx");
 assert.match(editor,/BriefAiSendPanel/);
 assert.match(editor,/finalizedId&&preview&&/);
 assert.match(editor,/reviewedText=\{preview\}/);
 assert.match(editor,/!finalizedId&&/);
 assert.match(editor,/function invalidate\(\)\{setPreview\(null\)/);
 assert.match(editor,/setFinalizedId\(null\)/);
});
test("SMN-485 client selects free approved connection only and checks full server preview",()=>{
 const ui=read("src/app/app/admin/ai-briefs/prepare/brief-ai-send-panel.tsx");
 assert.match(ui,/free\.some\(m=>m\.providerId===c\.providerId&&m\.modelId===c\.modelId\)/);
 assert.match(ui,/c\.enabled&&c\.credentialState==="configured"/);
 assert.match(ui,/c\.lastTestStatus==="passed"/);
 assert.match(ui,/data\.preview!==reviewedText/);
 assert.match(ui,/sameDestination\(chosen,data\)/);
 assert.match(ui,/preview\.preview!==reviewedText/);
 assert.match(ui,/setConsent\(false\)/);
 assert.match(ui,/approval-expired-or-reused/);
 assert.match(ui,/beforeunload/);
});
test("SMN-485 sends only after explicit consent and never auto-persists responses",()=>{
 const ui=read("src/app/app/admin/ai-briefs/prepare/brief-ai-send-panel.tsx");
 assert.match(ui,/onClick=\{\(\)=>void send\(\)\}/);
 assert.match(ui,/onChange=\{e=>setConsent\(e\.target\.checked\)\}/);
 assert.match(ui,/busy\.current=true/);
 assert.match(ui,/result\.stored!==false/);
 assert.match(ui,/setAnswer\(result\)/);
 assert.match(ui,/window\.confirm/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage|indexedDB|saveManualAiResponse|\/api\/ai-briefs\/archives\/.*\/responses"/);
});
test("SMN-485 translations FR EN are complete and support quota/privacy failures",()=>{
 const fr=JSON.parse(read("src/i18n/ai-connections.fr.json")).aiSend as Record<string,string>;
 const en=JSON.parse(read("src/i18n/ai-connections.en.json")).aiSend as Record<string,string>;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of ["privacy","consent","send","unsaved","quota","auth","network","expired","changed"]){
  assert.ok(fr[key]?.length>10, key+":fr");
  assert.ok(en[key]?.length>10, key+":en");
 }
});
