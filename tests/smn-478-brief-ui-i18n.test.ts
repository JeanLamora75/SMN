import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {aiBriefMessages,aiBriefText} from "../src/lib/ai-brief-messages";
import {initialBriefTemplates} from "../src/lib/ai-brief-templates";
import {localizedNativeBrief} from "../src/lib/ai-brief-native-locales";
import {insertPromptTag} from "../src/lib/ai-brief-tag-insertion";
import {canApproveBrief} from "../src/lib/ai-brief-review";

const root=(file:string)=>readFileSync(file,"utf8");
test("SMN-478: French/English feature dictionary has identical, populated keys",()=>{
 const french=Object.keys(aiBriefMessages.fr).sort();
 const english=Object.keys(aiBriefMessages.en).sort();
 assert.deepEqual(french,english);
 assert.ok(french.length>=100);
 for(const key of french){
  assert.ok(aiBriefMessages.fr[key as keyof typeof aiBriefMessages.fr].trim());
  assert.ok(aiBriefMessages.en[key as keyof typeof aiBriefMessages.en].trim());
 }
 assert.equal(aiBriefText("es","preview"),aiBriefMessages.fr.preview);
 assert.notEqual(aiBriefText("en","preview"),aiBriefText("fr","preview"));
});
test("SMN-478: built-in prompts are localized without altering identifiers, revisions or saved data",()=>{
 for(const t of initialBriefTemplates){
  const model={...t,builtin:true,revision:0,active:true};
  const english=localizedNativeBrief(model,"en");
  assert.equal(english.id,model.id);
  assert.equal(english.revision,model.revision);
  assert.equal(english.builtin,true);
  assert.notEqual(english.promptText,model.promptText);
  assert.match(english.promptText,/\{\{SPRINT_NAME\}\}/);
  assert.deepEqual(localizedNativeBrief(model,"fr"),model);
  const copy={...model,builtin:false};
  assert.deepEqual(localizedNativeBrief(copy,"en"),copy);
 }
});
test("SMN-478: cursor, selection and privacy review invalidate after content changes",()=>{
 const input="Introduction : vérifiez la date.";
 const before=insertPromptTag(input,"{{SPRINT_START}}",15,15);
 assert.equal(before.text,"Introduction : {{SPRINT_START}}vérifiez la date.");
 const replaced=insertPromptTag(before.text,"{{TEAM_NAME}}",0,12);
 assert.equal(replaced.text.slice(0,13),"{{TEAM_NAME}}");
 const approved={preview:before.text,currentTxt:before.text,reviewedText:before.text,
  privacyReviewed:true,revisionChecked:true,conflict:false};
 assert.equal(canApproveBrief(approved),true);
 assert.equal(canApproveBrief({...approved,currentTxt:before.text+" updated"}),false);
 assert.equal(canApproveBrief({...approved,conflict:true}),false);
 assert.equal(canApproveBrief({...approved,privacyReviewed:false}),false);
});
test("SMN-478: responsive controls, dialog affordances and admin guards are present",()=>{
 const editor=root("src/app/app/admin/ai-briefs/templates/template-editor.tsx");
 const prepare=root("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx");
 const api=root("src/app/api/admin/ai-briefs/templates/route.ts");
 assert.match(editor,/useLocale\(\)/);
 assert.match(editor,/localizedNativeBrief/);
 assert.match(editor,/OfficeTagConfigurator/);
 assert.match(editor,/onSelect=/);
 assert.match(editor,/setSelectionRange/);
 assert.match(editor,/window\.confirm/);
 assert.match(prepare,/d-lg-none/);
 assert.match(prepare,/d-none d-lg-block/);
 assert.match(prepare,/aria-pressed=/);
 assert.match(prepare,/aria-label="Mode de travail"/);
 assert.match(prepare,/privacyReviewed/);
 assert.match(prepare,/canApproveBrief/);
 assert.match(api,/authorizeApi\(req,"write"/);
 assert.match(api,/allowMutation\(req\)/);
 assert.doesNotMatch(editor,/\{!current\?\.builtin&&\{/);
});
