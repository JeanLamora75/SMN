import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readFileSync} from "node:fs";
import {readOfficeMemberGroups,splitOfficeMembersByAssignment} from "../src/server/reports/office-word-rows";
import {generateWordTables} from "../scripts/smn-400-word-tables.mjs";
import {generatePowerPointTables} from "../scripts/smn-401-powerpoint-tables.mjs";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";

test("member split uses inclusive assignment end and never includes future assignments",()=>{
 const records=[
  {start_on:"2026-11-01",end_on:null,id:"active"},
  {start_on:"2026-10-15",end_on:"2026-11-07",id:"departure-on-last-day"},
  {start_on:"2026-09-01",end_on:"2026-10-01",id:"former"},
  {start_on:"2026-11-08",end_on:null,id:"future"}
 ];
 const groups=splitOfficeMembersByAssignment(records,"2026-11-07");
 assert.deepEqual(groups.active.map(x=>x.id),["active","departure-on-last-day"]);
 assert.deepEqual(groups.inactive.map(x=>x.id),["former"]);
});

test("Office projection includes both active and inactive members, plus professional function",async()=>{
 const queries:string[]=[];
 const members=[
  {name:"Alice",role:"Développeuse",start_on:"2026-11-01",end_on:null,city:"Paris",country_iso2:"FR"},
  {name:"Bob",role:"Testeur",start_on:"2026-10-01",end_on:"2026-10-28",city:"Berlin",country_iso2:"DE"},
  {name:"Carla",role:"PO",start_on:"2026-09-01",end_on:"2026-11-07",city:"Madrid",country_iso2:"ES"}
 ];
 const db={query:async(sql:string,params:unknown[])=>{
  queries.push(sql);
  assert.deepEqual(params,["team-1","sprint-1"]);
  return sql.includes("AS last_day")?{rows:[{last_day:"2026-11-07"}]}:{rows:members};
 }} as unknown as Client;
 const result=await readOfficeMemberGroups(db,"team-1","sprint-1","fr");
 assert.deepEqual(result.active.map(m=>m.MEMBER_NAME),["Alice","Carla"]);
 assert.deepEqual(result.inactive.map(m=>m.MEMBER_NAME),["Bob"]);
 assert.equal(result.active[0].MEMBER_FUNCTION,"Développeuse");
 assert.equal(result.active[0].MEMBER_ROLE,"Développeuse");
 assert.equal(result.inactive[0].MEMBER_FUNCTION,"Testeur");
 assert.equal(result.inactive[0].MEMBER_COUNTRY,"Allemagne");
 assert.ok(queries.some(q=>q.includes("DISTINCT ON (m.id)")));
 assert.ok(queries.some(q=>q.includes("a.start_on <")));
 assert.ok(queries.some(q=>q.includes("s.team_id=t.id")));
 assert.ok(queries.some(q=>q.includes("ml.effective_from <")));
});

test("Word and PowerPoint render both lists independently, including function",()=>{
 const tags=[
  ["MEMBERS_ACTIVE","Active","Développeuse"],
  ["MEMBERS_INACTIVE","Inactive","Testeur"]
 ] as const;
 for(const format of ["docx","pptx"] as const){
  const rows=tags.map(([source])=>
   format==="docx"?
    '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{ROW:'+source+'}}{{MEMBER_NAME}} - {{MEMBER_FUNCTION}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>':
    '<a:tbl><a:tr h="250"><a:tc><a:txBody><a:p><a:r><a:t>{{ROW:'+source+'}}{{MEMBER_NAME}} - {{MEMBER_FUNCTION}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl>');
  const part=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const bytes=writeZip([
   {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
   {name:format==="docx"?"word/document.xml":"ppt/presentation.xml",data:Buffer.from(format==="docx"?"<w:document>"+rows.join("")+"</w:document>":"<p:presentation/>")},
   ...(format==="pptx"?[{name:part,data:Buffer.from("<p:sld>"+rows.join("")+"</p:sld>") }]:[])
  ]);
  const values={
   MEMBERS_ACTIVE:[{MEMBER_NAME:"Alice",MEMBER_FUNCTION:"Développeuse"}],
   MEMBERS_INACTIVE:[{MEMBER_NAME:"Bob",MEMBER_FUNCTION:"Testeur"}]
  };
  const output=format==="docx"?generateWordTables(bytes,values).bytes:generatePowerPointTables(bytes,values).bytes;
  const xml=readZip(output).find(p=>p.name===part)!.data.toString();
  assert.match(xml,/Alice - Développeuse/);
  assert.match(xml,/Bob - Testeur/);
  assert.doesNotMatch(xml,/\{\{ROW:MEMBERS_(?:ACTIVE|INACTIVE)\}\}/);
 }
});

test("PowerPoint empty member group displays localized message in text shapes",()=>{
 const marker='<p:sp><p:txBody><a:p><a:r><a:t>{{ROW:MEMBERS_INACTIVE}}{{MEMBER_NAME}}</a:t></a:r></a:p></p:txBody></p:sp>';
 const source=writeZip([
  {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
  {name:"ppt/presentation.xml",data:Buffer.from("<p:presentation/>")},
  {name:"ppt/slides/slide1.xml",data:Buffer.from("<p:sld>"+marker+"</p:sld>")}
 ]);
 for(const [locale,message] of [["fr","Aucun membre inactif"],["en","No inactive members"]] as const){
  const output=generatePowerPointTables(source,{MEMBERS_INACTIVE:[]},locale).bytes;
  const xml=readZip(output).find(p=>p.name==="ppt/slides/slide1.xml")!.data.toString();
  assert.ok(xml.includes(message));
  assert.ok(!xml.includes("{{ROW:"));
 }
});

test("Tags page exposes two member families rather than legacy combined list",()=>{
 const source=readFileSync("src/app/app/reports/office-tags.tsx","utf8");
 const route=readFileSync("src/app/api/admin/reports/office-templates/generate/route.ts","utf8");
 assert.match(source,/source:"MEMBERS_ACTIVE"/);
 assert.match(source,/source:"MEMBERS_INACTIVE"/);
 assert.doesNotMatch(source,/source:"MEMBERS",/);
 assert.match(source,/MEMBER_FUNCTION/);
 assert.match(route,/MEMBERS_ACTIVE:members.active/);
 assert.match(route,/MEMBERS_INACTIVE:members.inactive/);
 assert.match(route,/MEMBERS:\[\.\.\.members.active,\.\.\.members.inactive\]/);
});
