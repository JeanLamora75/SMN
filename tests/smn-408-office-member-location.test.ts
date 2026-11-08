import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readFileSync} from "node:fs";
import {readOfficeWordMembers,officeCountryFlag,officeCountryName} from "../src/server/reports/office-word-rows";
import {generateWordTables} from "../scripts/smn-400-word-tables.mjs";
import {generatePowerPointTables} from "../scripts/smn-401-powerpoint-tables.mjs";
import {readZip,writeZip} from "../scripts/smn-397-office-poc.mjs";

test("office member flag is generated from ISO country without using an external image or network",()=>{
 assert.equal(officeCountryFlag("FR"),"🇫🇷");
 assert.equal(officeCountryFlag("IN"),"🇮🇳");
 assert.equal(officeCountryFlag("GB"),"🇬🇧");
 assert.equal(officeCountryFlag(null),null);
 assert.equal(officeCountryFlag("XX1"),null);
 assert.equal(officeCountryName("FR","fr"),"France");
 assert.equal(officeCountryName("FR","en"),"France");
 assert.equal(officeCountryName("DE","fr"),"Allemagne");
 assert.equal(officeCountryName("DE","en"),"Germany");
});

test("member rows use current database location independently of sprint date",async()=>{
 const queries:Array<{sql:string;params:unknown[]|undefined}>=[];
 const data=[
  {name:"Alice",role:"Developer",start_on:"2026-01-01",end_on:null,city:"Paris",country_iso2:"FR"},
  {name:"Bob",role:"Developer",start_on:"2026-01-02",end_on:null,city:"Berlin",country_iso2:"DE"},
  {name:"Charlie",role:null,start_on:"2026-01-03",end_on:null,city:null,country_iso2:null}
 ];
 const db={query:async(sql:string,params?:unknown[])=>{queries.push({sql,params});return sql.includes("AS last_day")?{rows:[{last_day:"2026-01-10"}]}:{rows:data};}} as unknown as Client;
 const result=await readOfficeWordMembers(db,"team1","sprint1","fr");
 assert.equal(result.length,3);
 assert.equal(result[0].MEMBER_CITY,"Paris");
 assert.equal(result[0].MEMBER_COUNTRY,"France");
 assert.equal(result[0].MEMBER_FLAG,"🇫🇷");
 assert.equal(result[1].MEMBER_COUNTRY,"Allemagne");
 assert.equal(result[1].MEMBER_FLAG,"🇩🇪");
 assert.equal(result[2].MEMBER_FLAG,null);
 assert.equal(result[2].MEMBER_COUNTRY,null);
 assert.ok(queries[0].sql.includes("smn_member_location"));
 assert.match(queries[0].sql,/ml.effective_from<=CURRENT_DATE/);
 assert.doesNotMatch(queries[0].sql,/CASE WHEN ml.effective_from/);
 assert.match(queries[0].sql,/ORDER BY ml.effective_from DESC,ml.revision DESC LIMIT 1/);
 assert.match(queries[0].sql,/s.team_id=t.id/);
 assert.deepEqual(queries[0].params,["team1","sprint1"]);
 const en=await readOfficeWordMembers(db,"team1","sprint1","en");
 assert.equal(en[1].MEMBER_COUNTRY,"Germany");
});

test("Word and PowerPoint replace location and Unicode flag tags in member rows",()=>{
 const row='{\u007bROW:MEMBERS}}{\u007bMEMBER_CITY}} / {\u007bMEMBER_COUNTRY}} / {\u007bMEMBER_FLAG}}';
 const records=[{MEMBER_CITY:"Paris",MEMBER_COUNTRY:"France",MEMBER_FLAG:"🇫🇷"}];
 for(const format of ["docx","pptx"] as const){
  const data=format==="docx"?
    '<w:document><w:tbl><w:tr><w:tc><w:p><w:r><w:t>'+row+'</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:document>':
    '<p:sld><a:tbl><a:tr h="200"><a:tc><a:txBody><a:p><a:r><a:t>'+row+'</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></p:sld>';
  const part=format==="docx"?"word/document.xml":"ppt/slides/slide1.xml";
  const source=writeZip([
   {name:"[Content_Types].xml",data:Buffer.from("<Types/>")},
   {name:format==="docx"?"word/document.xml":"ppt/presentation.xml",data:Buffer.from(format==="docx"?data:"<p:presentation/>")},
   ...(format==="pptx"?[{name:part,data:Buffer.from(data)}]:[])
  ]);
  const out=format==="docx"?generateWordTables(source,{MEMBERS:records}).bytes:
   generatePowerPointTables(source,{MEMBERS:records}).bytes;
  const xml=readZip(out).find(p=>p.name===part)!.data.toString();
  assert.match(xml,/Paris \/ France \/ 🇫🇷/);
  assert.doesNotMatch(xml,/\{\{MEMBER_(?:CITY|COUNTRY|FLAG)\}\}/);
 }
});

test("Tags documentation offers each location tag and copy action",()=>{
 const source=readFileSync("src/app/app/reports/office-tags.tsx","utf8");
 for(const tag of ["MEMBER_CITY","MEMBER_COUNTRY","MEMBER_FLAG"])assert.ok(source.includes(tag));
 assert.ok(source.includes("CopyOfficeTag"));
 assert.ok(source.includes("Unicode"));
});
