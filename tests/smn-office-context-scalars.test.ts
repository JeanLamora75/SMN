import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {buildScalarValues,generateScalarOffice} from "../scripts/smn-399-office-scalars.mjs";
import {readOfficeContextScalars,officeReportDate} from "../src/server/reports/office-context-scalars";

type Query={sql:string;values:unknown[]};
const now=new Date("2026-11-07T23:30:00.000Z");
function dbMock({closed=false,hasContext=true,hasGoals=true}:{
 closed?:boolean;hasContext?:boolean;hasGoals?:boolean
}={}){
 const seen:Query[]=[];
 const db={
  query:async(sql:string,values:unknown[]=[]):Promise<{rows:unknown[]}>=>{
   seen.push({sql,values});
   if(sql.includes("to_regclass('public.smn_team_context')"))
    return {rows:[{present:hasContext}]};
   if(sql.includes("information_schema.columns")&&sql.includes("smn_team_context"))
    return {rows:["team_id","vision","product_goal","dod","dor"].map(column_name=>({column_name}))};
   if(sql.includes("SELECT c.* FROM public.smn_team_context"))
    return {rows:hasContext?[{
     vision:"Une plateforme simple & utile",product_goal:"Améliorer la fiabilité",
     language:"fr",updated_at:"2026-10-20T09:00:00Z"
    }]:[]};
   if(sql.includes("SELECT s.status FROM public.smn_sprint"))
    return {rows:[{status:closed?"closed":"active"}]};
   if(sql.includes("SELECT to_regclass($1) IS NOT NULL AS present"))
    return {rows:[{present:hasGoals}]};
   if(sql.includes("to_regclass('public.smn_sprint_historical_goal_detail')"))
    return {rows:[{present:false}]};
   if(sql.includes("FROM public.smn_sprint_goal g"))
    return {rows:[
     {id:"g1",title:"Livrer le pilote",evaluation:"not_evaluated",comment:null,revision:1,description:null},
     {id:"g2",title:"Sécuriser le déploiement",evaluation:"not_evaluated",comment:null,revision:1,description:null}
    ]};
   if(sql.includes("FROM public.smn_sprint_closure_snapshot"))
    return {rows:[{version:2,snapshot:{goals:[
     {id:"g1",title:"Objectif archivé A",evaluation:"achieved",revision:1,comment:null},
     {id:"g2",title:"Objectif archivé B",evaluation:"partially_achieved",revision:1,comment:null}
    ]}}]};
   throw Error("Unhandled query: "+sql);
  }
 } as unknown as Client;
 return {db,seen};
}
test("All nine requested scalar keys are present in the Office value catalog",()=>{
 const result=buildScalarValues({
  TEAM_NAME:"Équipe 1",SPRINT_NAME:"Sprint 27",
  SPRINT_START:"3 mars 2025",SPRINT_END:"16 mars 2025",
  TODAY:"8 novembre 2026",SPRINT_GOAL:"Livrer",
  PRODUCT_NAME:"SMN",PRODUCT_GOAL:"Piloter",PRODUCT_VISION:"Vision"
 });
 for(const name of ["TEAM_NAME","SPRINT_NAME","SPRINT_START","SPRINT_END","TODAY",
  "SPRINT_GOAL","PRODUCT_NAME","PRODUCT_GOAL","PRODUCT_VISION"])
  assert.ok(Object.hasOwn(result,name),name);
});
test("Sources: live sprint returns every goal and product context limited to team",async()=>{
 const {db,seen}=dbMock();
 const values=await readOfficeContextScalars(db,"team-a","sprint-a","SMN",
  "fr","Europe/Paris",now);
 assert.equal(values.SPRINT_GOAL,"Livrer le pilote ; Sécuriser le déploiement");
 assert.equal(values.PRODUCT_GOAL,"Améliorer la fiabilité");
 assert.equal(values.PRODUCT_VISION,"Une plateforme simple & utile");
 assert.equal(values.PRODUCT_NAME,"SMN");
 assert.equal(values.TODAY,"8 nov. 2026");
 assert.ok(seen.some(x=>x.values[0]==="team-a"));
 assert.ok(seen.some(x=>x.values[0]==="sprint-a"&&x.values[1]==="team-a"));
});
test("Closed sprint uses frozen goals, never the live goal table",async()=>{
 const {db,seen}=dbMock({closed:true});
 const values=await readOfficeContextScalars(db,"team-a","sprint-a","Produit",
  "fr","Europe/Paris",now);
 assert.equal(values.SPRINT_GOAL,"Objectif archivé A ; Objectif archivé B");
 assert.ok(seen.some(x=>x.sql.includes("smn_sprint_closure_snapshot")));
 assert.ok(!seen.some(x=>x.sql.includes("FROM public.smn_sprint_goal g")));
});
test("Absent context and missing goals become null for N/D, not fictional data",async()=>{
 const {db}=dbMock({hasContext:false,hasGoals:false});
 const values=await readOfficeContextScalars(db,"team-a","sprint-a",null,
  "en","UTC",now);
 assert.equal(values.SPRINT_GOAL,null);
 assert.equal(values.PRODUCT_NAME,null);
 assert.equal(values.PRODUCT_GOAL,null);
 assert.equal(values.PRODUCT_VISION,null);
 assert.equal(values.TODAY,"7 Nov 2026");
});
test("Generation-day date respects chosen language and sprint timezone",()=>{
 assert.equal(officeReportDate(now,"fr","Europe/Paris"),"8 nov. 2026");
 assert.equal(officeReportDate(now,"en","UTC"),"7 Nov 2026");
 assert.notEqual(officeReportDate(now,"fr","UTC"),officeReportDate(now,"fr","Europe/Paris"));
});
function makeTemplate(format:"docx"|"pptx"){
 const scalar=Object.keys(buildScalarValues({
  TEAM_NAME:"Équipe 1",SPRINT_NAME:"Sprint 27",SPRINT_START:"03/03/2025",
  SPRINT_END:"16/03/2025",TODAY:"08/11/2026",
  SPRINT_GOAL:"Livrer ; Tester",PRODUCT_NAME:"Produit A",
  PRODUCT_GOAL:"Objectif B",PRODUCT_VISION:"Vision & Innovation"
 })).map(k=>"{{"+k+"}}");
 const xml=format==="docx"?
  '<w:document>'+scalar.map(k=>'<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>'+
   k.slice(0,5)+'</w:t></w:r><w:r><w:t>'+k.slice(5)+'</w:t></w:r></w:p>').join("")+
   '<w:p><w:r><w:t>{{UNKNOWN_TAG}}</w:t></w:r></w:p></w:document>':
  '<p:sld>'+scalar.map(k=>'<a:p><a:r><a:rPr b="1"/><a:t>'+k.slice(0,5)+
   '</a:t></a:r><a:r><a:t>'+k.slice(5)+'</a:t></a:r></a:p>').join("")+
   '<a:p><a:r><a:t>{{UNKNOWN_TAG}}</a:t></a:r></a:p></p:sld>';
 return writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
  {name:format==="docx"?"word/document.xml":"ppt/presentation.xml",
   data:Buffer.from(format==="docx"?xml:"<p:presentation/>")},
  ...(format==="pptx"?[{name:"ppt/slides/slide1.xml",data:Buffer.from(xml)}]:[]),
  {name:"docProps/core.xml",data:Buffer.from("UNCHANGED")}
 ]);
}
for(const format of ["docx","pptx"] as const){
 test(format+": new context tags split across runs are substituted without altering fixed parts",()=>{
  const values=buildScalarValues({
   TEAM_NAME:"Équipe 1",SPRINT_NAME:"Sprint 27",SPRINT_START:"03/03/2025",
   SPRINT_END:"16/03/2025",TODAY:"08/11/2026",
   SPRINT_GOAL:"Livrer ; Tester",PRODUCT_NAME:"Produit A",
   PRODUCT_GOAL:"Objectif B",PRODUCT_VISION:"Vision & Innovation"
  });
  const source=makeTemplate(format),result=generateScalarOffice(source,format,values);
  const name=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const xml=readZip(result.bytes).find(p=>p.name===name)!.data.toString();
  assert.match(xml,/Livrer ; Tester/);
  assert.match(xml,/Vision &amp; Innovation/);
  assert.match(xml,/\{\{UNKNOWN_TAG\}\}/);
  assert.doesNotMatch(xml,/\{\{TEAM_NAME\}\}|\{\{PRODUCT_NAME\}\}/);
  assert.deepEqual(readZip(result.bytes).find(p=>p.name==="docProps/core.xml")!.data,
   readZip(source).find(p=>p.name==="docProps/core.xml")!.data);
 });
}
