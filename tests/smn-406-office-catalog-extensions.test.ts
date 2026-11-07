import test from "node:test";
import assert from "node:assert/strict";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";
import {generateWordTables} from "../scripts/smn-400-word-tables.mjs";
import {generatePowerPointTables} from "../scripts/smn-401-powerpoint-tables.mjs";
import {renderOfficeTrendPng} from "../scripts/smn-402-trend-png.mjs";
import {parseOfficeChartTag} from "../scripts/smn-402-office-chart-tags.mjs";
import {renderOfficeIndicatorChart} from "../src/server/reports/office-indicator-charts";
import {readOfficeBusinessRows,discoverOfficeBusinessSources,officeBusinessSources} from "../src/server/reports/office-business-rows";
import type {Client} from "pg";

const sources=["RISKS","OBSTACLES","DEPENDENCIES","NOTES","CEREMONIES","GOALS","ACTIONS","DECISIONS"] as const;
const fields=[
 ["RISK_TITLE","RISK_STATUS"],["OBSTACLE_TITLE","OBSTACLE_STATUS"],
 ["DEPENDENCY_TITLE","DEPENDENCY_STATUS"],["NOTE_TEXT","NOTE_STATUS"],["CEREMONY_TITLE","CEREMONY_STATUS"],
 ["GOAL_TITLE","GOAL_EVALUATION"],["ACTION_TITLE","ACTION_STATUS"],
 ["DECISION_TITLE","DECISION_DATE"]
];
function packageOf(format:"docx"|"pptx"){
 const rows=sources.map((name,i)=>
  format==="docx"
  ? '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{ROW:'+name+'}}{{'+fields[i][0]+'}}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>{{'+fields[i][1]+'}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
  : '<a:tbl><a:tr h="300"><a:tc><a:txBody><a:p><a:r><a:t>{{ROW:'+name+'}}{{'+fields[i][0]+'}}</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>{{'+fields[i][1]+'}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl>'
 ).join("");
 return writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
  {name:format==="docx"?"word/document.xml":"ppt/presentation.xml",data:Buffer.from(format==="docx"?'<w:document>'+rows+'</w:document>':"<p:presentation/>")},
  ...(format==="pptx"?[{name:"ppt/slides/slide1.xml",data:Buffer.from("<p:sld>"+rows+"</p:sld>")}]:[]),
  {name:"docProps/core.xml",data:Buffer.from("<core>IMMUTABLE</core>")}
 ]);
}
test("Eight business sources are discovered from Word and PowerPoint without a layout registry",()=>{
 for(const format of ["docx","pptx"] as const){
  assert.deepEqual(discoverOfficeBusinessSources(packageOf(format)),[...officeBusinessSources]);
 }
});
test("Eight business sources repeat in Word/PPTX, preserving other XML",()=>{
 const data=Object.fromEntries(sources.map((name,i)=>[name,[
  {[fields[i][0]]:"Premier & Alpha",[fields[i][1]]:"0"},
  {[fields[i][0]]:"Deuxième",[fields[i][1]]:null}
 ]]));
 for(const format of ["docx","pptx"] as const){
  const bytes=packageOf(format),produced=format==="docx"?
   generateWordTables(bytes,data).bytes:generatePowerPointTables(bytes,data).bytes;
  const before=new Map(readZip(bytes).map(p=>[p.name,p.data]));
  const after=new Map(readZip(produced).map(p=>[p.name,p.data]));
  assert.deepEqual(after.get("docProps/core.xml"),before.get("docProps/core.xml"));
  const name=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const xml=after.get(name)!.toString();
  assert.equal((xml.match(format==="docx"?/<w:tr(?:\s|>)/g:/<a:tr(?:\s|>)/g)||[]).length,16);
  assert.equal((xml.match(/Premier &amp; Alpha/g)||[]).length,8);
  assert.equal((xml.match(/Deuxième/g)||[]).length,7);
  assert.match(xml,/N\/D/);
  assert.match(xml,/>0<\/(?:w:t|a:t)>/);
  assert.doesNotMatch(xml,/\{\{ROW:/);
 }
});
test("No records for all sources yields N/D but keeps every table",()=>{
 const empty=Object.fromEntries(sources.map(s=>[s,[]]));
 for(const format of ["docx","pptx"] as const){
  const result=format==="docx"?generateWordTables(packageOf(format),empty).bytes:
   generatePowerPointTables(packageOf(format),empty).bytes;
  const name=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const xml=readZip(result).find(p=>p.name===name)!.data.toString();
  assert.equal((xml.match(/N\/D/g)||[]).length,14);
 }
});
const indicatorReport={
 columns:[
  {id:"a",tag:"A",name:"Done",unit:"SP",style:"line",order:0},
  {id:"b",tag:"B",name:"Initial",unit:"SP",style:"line",order:1}
 ],
 cycles:[
  {id:"c1",name:"S1",status:"closed",values:{a:"20",b:"30"}},
  {id:"c2",name:"S2",status:"active",values:{a:"65",b:"35"}}
 ]
};
test("Sector, donut and gauge tags produce PNG images",()=>{
 for(const type of ["pie","donut","gauge"] as const){
  const input=type==="gauge"?"{{CHART:TREND|TAGS=A|TYPE=gauge}}":
   "{{CHART:TREND|TAGS=A,B|TYPE="+type+"}}";
  const opts=parseOfficeChartTag(input) as {last:number;type:typeof type;tags:string[]|null};
  const png=renderOfficeIndicatorChart(indicatorReport,"c2",opts,"fr");
  assert.ok(png&&png.length>1000);
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 }
});
test("Sector, donut and gauge rendered images are visually distinct bytewise",()=>{
 const series=[{name:"Done",values:[20,65]},{name:"Initial",values:[30,35]}];
 const cycles=[{name:"S1"},{name:"S2"}];
 const pie=renderOfficeTrendPng({cycles,series,type:"pie"});
 const donut=renderOfficeTrendPng({cycles,series,type:"donut"});
 const gauge=renderOfficeTrendPng({cycles,series:series.slice(0,1),type:"gauge"});
 assert.ok(pie&&donut&&gauge);
 assert.notDeepEqual(pie,donut);
 assert.notDeepEqual(gauge,donut);
});
test("Invalid percentage, mixed units and negative shares fail without a fake chart",()=>{
 const cycles=[{name:"S1"}];
 assert.throws(()=>renderOfficeTrendPng({cycles,series:[{name:"x",values:[101]}],type:"gauge"}),/gauge-range/);
 assert.throws(()=>renderOfficeTrendPng({cycles,series:[{name:"x",values:[-1]}],type:"pie"}),/negative-share/);
 assert.throws(()=>renderOfficeTrendPng({cycles,series:[
  {name:"x",values:[20]},{name:"y",values:[30]}
 ],type:"gauge"}),/one-series/);
 assert.equal(renderOfficeTrendPng({cycles,series:[{name:"x",values:[0]}],type:"pie"}),null);
});
test("Projection of eight business sources uses authorized sprint and canonical projections",async()=>{
 const team="t1",cycle="c1";
 const seen:Array<{sql:string;params:unknown[]}>=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  seen.push({sql,params});
  if(sql.includes("SELECT s.status FROM"))return {rows:[{status:"active"}]};
  if(sql.includes("to_regclass('public.smn_registry_item')"))return {rows:[{
   items:true,links:false,audit:false,assess:false,automatic:false,
   goals:true,selection:false,invalidated:false
  }]};
  if(sql.includes("r.id=ANY($2::text[])"))return {rows:[{
   id:"2",owner:"SM",due_on:"2026-10-16",team_name:"Équipe A",
   requester:{kind:"local",teamId:team},
   contributor:{kind:"external",name:"Équipe fournisseur"},
   at_risk:true
  }]};
  if(sql.includes("FROM public.smn_registry_item r"))return {rows:[
   ...(["risk","obstacle","dependency","action","decision"] as const).map((type,i)=>({
    id:String(i),type,title:type+" example",status:"open",
    date:"2026-10-12T10:00:00Z",openedAt:"2026-10-12T10:00:00Z",
    closedAt:null,sprintIds:[],priority:null
   }))
  ]};
  if(sql.includes("to_regclass('public.smn_dependency_parties') IS NOT NULL AS parties"))
   return {rows:[{parties:true,vigilance:true}]};
  if(sql.includes("to_regclass($1)"))return {rows:[{present:true}]};
  if(sql.includes("to_regclass('public.smn_sprint_historical_goal_detail')"))
   return {rows:[{present:false}]};
  if(sql.includes("FROM public.smn_sprint_goal g"))return {rows:[{
   id:"g1",title:"Deliver",evaluation:"achieved",comment:null,
   description:"Description",revision:1
  }]};
  if(sql.includes("information_schema.columns"))return {rows:[
   ...["smn_sprint_ceremony","smn_scrum_template_occurrence","smn_sprint_exceptional_meeting"]
    .flatMap(table=>["id","sprint_id","starts_at","ends_at",table==="smn_sprint_ceremony"?"kind":"name"]
     .map(column=>({table_name:table,column_name:column})))
  ]};
  if(sql.includes("COUNT(*)::text AS total"))return {rows:[{total:"1"}]};
  if(sql.includes("ORDER BY starts_at ASC,source_kind"))return {rows:[{
   source_kind:"standard",id:"cer1",kind:"planning",title:"Planning",
   starts_at:"2026-10-12T10:00:00Z",ends_at:"2026-10-12T11:00:00Z",status:"held",
   status_explicit:true,planned_minutes:60,actual_minutes:50
  }]};
  if(sql.includes("to_regclass('public.smn_dashboard_note')"))return {rows:[{present:true}]};
  if(sql.includes("FROM public.smn_dashboard_note n"))return {rows:[{
   body:"Note privée d'équipe",status:"open",created_at:"2026-10-12T08:00:00Z"
  }]};
  throw Error("Unmocked query: "+sql);
 }} as unknown as Client;
 const result=await readOfficeBusinessRows(db,team,{id:cycle,startAt:"2026-10-10T00:00:00Z",endAt:"2026-10-17T00:00:00Z",timeZone:"UTC"},"fr",sources);
 for(const key of sources)assert.equal(result[key]?.length,1,key);
 assert.equal(result.RISKS?.[0].RISK_TITLE,"risk example");
 assert.equal(result.DEPENDENCIES?.[0].DEPENDENCY_TITLE,"dependency example");
 assert.equal(result.DEPENDENCIES?.[0].DEPENDENCY_REQUESTER,"Équipe A");
 assert.equal(result.DEPENDENCIES?.[0].DEPENDENCY_CONTRIBUTOR,"Équipe fournisseur");
 assert.equal(result.DEPENDENCIES?.[0].DEPENDENCY_AT_RISK,"Oui");
 assert.equal(result.CEREMONIES?.[0].CEREMONY_STATUS,"Tenue");
 assert.equal(result.GOALS?.[0].GOAL_EVALUATION,"Atteint");
 assert.equal(result.NOTES?.[0].NOTE_TEXT,"Note privée d'équipe");
 assert.ok(seen.some(s=>s.params[0]===team));
 assert.ok(seen.filter(s=>s.sql.includes("FROM public.smn_dashboard_note")).every(s=>s.params[1]===cycle));
});
