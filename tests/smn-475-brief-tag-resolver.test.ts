import test from "node:test";
import assert from "node:assert/strict";
import {resolveBriefPrompt} from "../src/lib/ai-brief-tag-resolver";

const input={
 mode:"scrum" as const,preparedAt:"2026-11-16T06:00:00.000Z",
 context:{id:"123",name:"Sprint A",team:"Équipe Alpha",product:"Produit 1",status:"active",startAt:"2026-11-09",endAt:"2026-11-20",timeZone:"Europe/Paris"},
 facts:{"scrum.storyPoints.completed":{key:"scrum.storyPoints.completed",label:"SP terminés",value:"12",unit:"SP",source:"sprint",quality:"recorded" as const,snapshotVersion:null}}
};
test("SMN-475 scalar preserves provenance-free basic context",()=>{
 const result=resolveBriefPrompt({...input,promptText:"Équipe {{TEAM_NAME}}, cycle {{SPRINT_NAME}}"});
 assert.equal(result.text,"Équipe Équipe Alpha, cycle Sprint A");
 assert.equal(result.safe,true);
});
test("SMN-475 unknown, chart and personal text are blocked",()=>{
 const result=resolveBriefPrompt({...input,promptText:"{{NOT_A_TAG}} {{CHART:TREND}} {{SPRINT_GOAL}}"});
 assert.equal(result.safe,false);
 assert.equal(result.diagnostics.length,3);
 assert.match(result.text,/TAG NON RÉSOLU/);
});
test("SMN-475 collective row carries unit and source",()=>{
 const result=resolveBriefPrompt({...input,promptText:"{{ROW:INDICATORS}}"});
 assert.equal(result.safe,true);
 assert.match(result.text,/12 SP/);
 assert.match(result.text,/source: sprint/);
});
test("SMN-475 no individual data, no invented values",()=>{
 const result=resolveBriefPrompt({...input,facts:{},promptText:"{{ROW:MEMBERS_ACTIVE}} {{PRODUCT_GOAL}}"});
 assert.equal(result.safe,false);
 assert.doesNotMatch(result.text,/Équipe Alpha/);
});

test("SMN-475: official report indicator projection resolves only available values",()=>{
 const indicators=[
  {tag:"VELOCITY",value:"24",unit:"SP",source:"computed",available:true,reason:null},
  {tag:"PRIVATE",value:null,unit:"SP",source:"manual",available:false,reason:"missing_source"}
 ];
 const available=resolveBriefPrompt({...input,indicators,promptText:"{{INDICATOR_VELOCITY}}"});
 assert.equal(available.safe,true);
 assert.match(available.text,/24 SP/);
 assert.match(available.text,/computed/);
 const missing=resolveBriefPrompt({...input,indicators,promptText:"{{INDICATOR_PRIVATE}}"});
 assert.equal(missing.safe,false);
 assert.equal(missing.diagnostics.length,1);
});
test("SMN-475: unsupported collection modifiers are not silently ignored",()=>{
 const result=resolveBriefPrompt({...input,promptText:"{{ROW:INDICATORS|SORT=INDICATOR_NAME:ASC}}"});
 assert.equal(result.safe,false);
});
