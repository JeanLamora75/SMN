import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {officeRowDefinitions,officeScalarDefinitions} from "../src/app/app/reports/office-tags";
import {serializeOfficeTag} from "../src/lib/office-tag-builder";
import {canOfferBriefTag,briefTagRestriction,AI_BRIEF_SAFE_ROW_FIELDS} from "../src/lib/brief-prompt-tag-policy";
import {insertBriefTagAtSelection} from "../src/lib/brief-prompt-tag-insertion";

const src=(path:string)=>readFileSync(path,"utf8");
const chart={type:"bar" as const,tags:[],last:6,style:"",explicitType:false,explicitLast:false};

test("Office remains the one canonical catalogue and tag serializer",()=>{
 const scalar=new Set(officeScalarDefinitions.map(x=>x.key));
 const rows=new Set(officeRowDefinitions.map(x=>x.source));
 for(const x of ["TEAM_NAME","SPRINT_NAME","PRODUCT_NAME"]){
  assert.ok(scalar.has(x));
  assert.equal(canOfferBriefTag("scalar",x,null),true);
  assert.equal(serializeOfficeTag({family:"scalar",key:x,rules:[],chart}),"{{"+x+"}}");
 }
 for(const x of ["GOALS","RISKS","INDICATORS","DECISIONS"]){
  assert.ok(rows.has(x));
  assert.equal(canOfferBriefTag("row",x,null),true);
  assert.equal(serializeOfficeTag({family:"row",key:x,rules:[],chart,allowedFields:[]}),"{{ROW:"+x+"}}");
 }
 for(const x of ["MEMBERS_ACTIVE","MEMBERS_INACTIVE","LINKS_TEAM","DEPENDENCIES","TICKETS"]){
  assert.ok(rows.has(x));
  assert.equal(canOfferBriefTag("row",x,null),false);
 }
 for(const row of officeRowDefinitions){
  if(!canOfferBriefTag("row",row.source,null))continue;
  assert.ok(row.fields.some(field=>AI_BRIEF_SAFE_ROW_FIELDS.has(field)));
  assert.ok(row.fields.every(field=>AI_BRIEF_SAFE_ROW_FIELDS.has(field)));
 }
 assert.equal(briefTagRestriction("chart","bar",null),"chart");
 assert.equal(briefTagRestriction("indicator","VELOCITY",null),"team");
 assert.equal(briefTagRestriction("row","MEMBERS_ACTIVE",null),"privacy");
 assert.equal(canOfferBriefTag("chart","bar",null),false);
});

test("inserts at cursor without changing adjacent text or line breaks",()=>{
 const source="Objectifs :\n\nAnalyse la suite.\n";
 const pos=source.indexOf("Analyse");
 const tag=serializeOfficeTag({family:"row",key:"GOALS",rules:[],chart,allowedFields:[]});
 const result=insertBriefTagAtSelection(source,tag,{start:pos,end:pos});
 assert.deepEqual(result,{
  text:"Objectifs :\n\n{{ROW:GOALS}}Analyse la suite.\n",
  caret:pos+tag.length
 });
});

test("replaces only highlighted text and keeps remaining characters intact",()=>{
 const s="Bonjour [objectif] !\nAnalyse.";
 const start=s.indexOf("[");const end=s.indexOf("]")+1;
 const value="{{SPRINT_GOAL}}";
 assert.deepEqual(insertBriefTagAtSelection(s,value,{start,end}),{
  text:"Bonjour {{SPRINT_GOAL}} !\nAnalyse.",caret:start+value.length
 });
});

test("refuses invalid or oversized tags without modifying input",()=>{
 assert.equal(insertBriefTagAtSelection("abc","{{CHART:TREND|TYPE=line}}",{start:1,end:1}),null);
 assert.equal(insertBriefTagAtSelection("abc","<script>",{start:1,end:1}),null);
 assert.equal(insertBriefTagAtSelection("abc","{{TEAM_NAME}}",{start:1,end:1},8),null);
 assert.equal(insertBriefTagAtSelection("abc","{{ROW:RISKS|SORT=RISK_DATE:DESC}}",{start:3,end:3},100)?.text,
  "abc{{ROW:RISKS|SORT=RISK_DATE:DESC}}");
});

test("the same Cockpit dialog supports insert mode while the report keeps copy mode",()=>{
 const office=src("src/app/app/reports/office-tag-configurator.tsx");
 const editor=src("src/app/app/admin/ai-briefs/templates/template-editor.tsx");
 const page=src("src/app/app/admin/ai-briefs/templates/page.tsx");
 assert.match(office,/onInsert\?:\(tag:string\)=>void/);
 assert.match(office,/onClick=\{insert\}/);
 assert.match(office,/onClick=\{\(\)=>void copy\(computed\)\}/);
 assert.match(office,/briefTagRestriction/);
 assert.match(office,/briefMode\?\s*<span className="badge text-bg-light"/);
 assert.match(office,/\(!briefMode\|\|allowedBrief\)/);
 assert.match(office,/tagDialogTitle/);
 assert.match(office,/onKey\(event:KeyboardEvent\)/);
 assert.match(office,/event\.key==="Escape"/);
 assert.match(office,/normalize\("NFD"\)/);
 assert.match(editor,/OfficeTagConfigurator/);
 assert.match(editor,/onInsert=\{insertTag\}/);
 assert.match(editor,/selection\.current/);
 assert.match(editor,/setSelectionRange\(result\.caret,result\.caret\)/);
 assert.match(page,/report-center-cockpit\.css/);
 assert.doesNotMatch(editor,/officeRowDefinitions|officeScalarDefinitions/);
});

test("French and English insertion labels are in sync",()=>{
 const fr=JSON.parse(src("src/i18n/fr.json")).briefPromptEditor;
 const en=JSON.parse(src("src/i18n/en.json")).briefPromptEditor;
 for(const key of ["insertTag","insert","tagPrivacyInfo","tagRestricted","chartsUnavailable","indicatorsUnavailable","tagInsertError"]){
  assert.equal(typeof fr[key],"string");assert.equal(typeof en[key],"string");
  assert.ok(fr[key].length&&en[key].length);
 }
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
});
