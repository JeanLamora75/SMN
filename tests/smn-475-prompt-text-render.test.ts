import assert from "node:assert/strict";
import {test} from "node:test";
import {renderBriefPrompt,type PromptRenderInput,type PromptValue} from "../src/lib/ai-brief-prompt-render";
import {serializeOfficeTag} from "../src/lib/office-tag-builder";
const value=(v:string|null,source="sprint-snapshot",quality:PromptValue["quality"]="recorded"):PromptValue=>({
 value:v,source,quality,unit:null,snapshotVersion:2
});
const input=(prompt:string,mode:"scrum"|"kanban"="scrum"):PromptRenderInput=>({
 prompt,locale:"fr",mode,teamId:"team-1",
 scalars:{TEAM_NAME:value("Équipe A"),SPRINT_NAME:value("Sprint 5"),SPRINT_GOAL:value(null)},
 indicators:{VELOCITY:{...value("17","report-indicator-projection","calculated"),unit:"SP"}},
 tables:{
  RISKS:{rows:[{RISK_TITLE:"Risque B",RISK_STATUS:"Ouvert",RISK_DATE:"2026-05-01"},{RISK_TITLE:"Risque A",RISK_STATUS:"Résolu",RISK_DATE:"2026-04-01"}],
   source:"sprint-closure",quality:"recorded",snapshotVersion:2},
  GOALS:{rows:[],source:"sprint-closure",quality:"recorded",snapshotVersion:2},
  INDICATORS:{rows:[{INDICATOR_NAME:"Velocity",INDICATOR_VALUE:"17",INDICATOR_UNIT:"SP"}],
   source:"report-indicator-projection",quality:"calculated"}
 }
});
test("resolves collective scalar and active indicator with unit, provenance and quality",()=>{
 const result=renderBriefPrompt(input("{{TEAM_NAME}} / {{SPRINT_NAME}} : {{INDICATOR_VELOCITY}}"));
 assert.equal(result.complete,true);
 assert.match(result.text,/Équipe A \[source : sprint-snapshot ; qualité : recorded ; version de clôture : 2\]/);
 assert.match(result.text,/17 SP \[source : report-indicator-projection ; qualité : calculated/);
 assert.equal(result.diagnostics.length,0);
});
test("renders authorized Office ROW with stable sorting and row count",()=>{
 const tag=serializeOfficeTag({family:"row",key:"RISKS",rules:[{field:"RISK_TITLE",direction:"ASC"}],
  allowedFields:["RISK_TITLE","RISK_STATUS","RISK_PRIORITY","RISK_DATE"],
  chart:{type:"bar",tags:[],last:6,style:"",explicitType:false,explicitLast:false}});
 const result=renderBriefPrompt(input(tag));
 assert.equal(result.complete,true);
 assert.match(result.text,/Risques \(2 éléments ; source : sprint-closure/);
 assert.ok(result.text.indexOf("Risque A")<result.text.indexOf("Risque B"));
 assert.match(result.text,/RISK_STATUS: Résolu/);
 assert.doesNotMatch(result.text,/MEMBER_NAME|DEPENDENCY_OWNER/);
});
test("empty known table is not the same as a missing data source",()=>{
 const empty=renderBriefPrompt(input("{{ROW:GOALS}}"));
 assert.equal(empty.complete,true);
 assert.match(empty.text,/Aucun élément consigné/);
 const missing=renderBriefPrompt(input("{{ROW:DEPENDENCIES}}"));
 assert.equal(missing.complete,false);
 assert.deepEqual(missing.diagnostics.map(d=>d.reason),["missing"]);
 assert.equal(missing.text,"{{ROW:DEPENDENCIES}}");
});
test("unknown, forbidden, invalid and chart tags fail closed",()=>{
 const source="{{UNREGISTERED}}\n{{ROW:MEMBERS_ACTIVE}}\n{{ROW:RISKS|SORT=RISK_OWNER:ASC}}\n{{CHART:TREND|TYPE=line}}";
 const result=renderBriefPrompt(input(source));
 assert.equal(result.complete,false);
 assert.deepEqual(result.diagnostics.map(d=>d.reason),["unknown","restricted","invalid","unsupported"]);
 assert.equal(result.text,source);
});
test("missing values and teamless indicator are never invented",()=>{
 const missing=renderBriefPrompt(input("But : {{SPRINT_GOAL}}"));
 assert.equal(missing.complete,false);
 assert.deepEqual(missing.diagnostics.map(d=>d.reason),["missing"]);
 const noTeam={...input("{{INDICATOR_VELOCITY}}"),teamId:null};
 assert.deepEqual(renderBriefPrompt(noTeam).diagnostics.map(d=>d.reason),["restricted"]);
});
test("bounded ROW rendering refuses silent truncation and caps output",()=>{
 const data=input("{{ROW:RISKS}}");
 assert.deepEqual(renderBriefPrompt({...data,maxRows:1}).diagnostics.map(d=>d.reason),["limit"]);
 assert.equal(renderBriefPrompt({...data,maxRows:1}).text,"{{ROW:RISKS}}");
 assert.equal(renderBriefPrompt({...data,prompt:"x".repeat(200001)}).complete,false);
});
test("Kanban uses the same renderer without Scrum-specific inference",()=>{
 const data=input("{{SPRINT_NAME}} et {{ROW:GOALS}}","kanban");
 const res=renderBriefPrompt(data);
 assert.equal(res.complete,true);
 assert.match(res.text,/Sprint 5/);
 assert.match(res.text,/Aucun élément consigné/);
});
test("a tag with sort on confidential column is rejected",()=>{
 const res=renderBriefPrompt(input("{{ROW:RISKS|SORT=MEMBER_NAME:ASC}}"));
 assert.deepEqual(res.diagnostics.map(d=>d.reason),["invalid"]);
});
