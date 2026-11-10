import test from "node:test";
import assert from "node:assert/strict";
import {parseOfficeRowMarker,sortOfficeRows} from "../scripts/smn-office-row-sort.mjs";
import {expandWordTablesXml} from "../scripts/smn-400-word-tables.mjs";
import {expandPowerPointTablesXml,expandPowerPointTextBoxesXml} from "../scripts/smn-401-powerpoint-tables.mjs";

const sources=new Set(["MEMBERS_ACTIVE","RISKS"]);
const records=[
 {MEMBER_NAME:"Zoé",MEMBER_FUNCTION:"Dev",MEMBER_VALUE:"2,5",MEMBER_DATE:"10 nov. 2026"},
 {MEMBER_NAME:"Alice",MEMBER_FUNCTION:"PO",MEMBER_VALUE:"10,5",MEMBER_DATE:"8 nov. 2026"},
 {MEMBER_NAME:"Bob",MEMBER_FUNCTION:"Dev",MEMBER_VALUE:null,MEMBER_DATE:"9 nov. 2026"},
 {MEMBER_NAME:"Alice",MEMBER_FUNCTION:"Dev",MEMBER_VALUE:"3,5",MEMBER_DATE:"7 nov. 2026"}
];
const tag="{{ROW:MEMBERS_ACTIVE|SORT=MEMBER_FUNCTION:ASC,MEMBER_NAME:DESC}}";
function assertOrder(xml,names){
 let previous=-1;
 for(const name of names){
  const index=xml.indexOf(">"+name+"<");
  assert.ok(index>previous, "Incorrect output order for "+name);
  previous=index;
 }
}
test("SORT parser accepts backward-compatible markers, defaults and multiple criteria",()=>{
 assert.deepEqual(parseOfficeRowMarker("RISKS",sources),{source:"RISKS",sort:[]});
 assert.deepEqual(parseOfficeRowMarker("MEMBERS_ACTIVE|SORT=MEMBER_FUNCTION,MEMBER_NAME:DESC",sources),{
  source:"MEMBERS_ACTIVE",sort:[{field:"MEMBER_FUNCTION",direction:"ASC"},{field:"MEMBER_NAME",direction:"DESC"}]
 });
 for(const invalid of ["RISKS|FILTER=foo","RISKS|SORT=","RISKS|SORT=X:DOWN",
  "RISKS|SORT=X:ASC,X:DESC","RISKS|SORT=X|SORT=Y","UNKNOWN|SORT=X"]){
  assert.throws(()=>parseOfficeRowMarker(invalid,sources));
 }
});
test("SORT is stable, numeric and chronological, with nulls always last",()=>{
 assert.deepEqual(sortOfficeRows(records,[{field:"MEMBER_FUNCTION",direction:"ASC"},
  {field:"MEMBER_NAME",direction:"DESC"}]).map(x=>x.MEMBER_NAME),["Zoé","Bob","Alice","Alice"]);
 assert.deepEqual(sortOfficeRows(records,[{field:"MEMBER_VALUE",direction:"DESC"}]).map(x=>x.MEMBER_VALUE),
  ["10,5","3,5","2,5",null]);
 assert.deepEqual(sortOfficeRows(records,[{field:"MEMBER_DATE",direction:"ASC"}]).map(x=>x.MEMBER_DATE),
  ["7 nov. 2026","8 nov. 2026","9 nov. 2026","10 nov. 2026"]);
 assert.deepEqual(sortOfficeRows(records,[]),records);
 assert.deepEqual(records[0].MEMBER_NAME,"Zoé");
 assert.throws(()=>sortOfficeRows(records,[{field:"INTRUDER",direction:"ASC"}]),/invalid-sort-column/);
});
test("Word applies SORT to marker split across text runs and keeps original without SORT",()=>{
 const word='<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{ROW:MEMBERS_ACTIVE|SORT=MEMBER_FUNCTION:ASC,</w:t></w:r>'+
  '<w:r><w:t>MEMBER_NAME:DESC}}{{MEMBER_NAME}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
 const result=expandWordTablesXml(word,{MEMBERS_ACTIVE:records}).xml;
 assertOrder(result,["Zoé","Bob","Alice"]);
 assert.doesNotMatch(result,/\{\{ROW:/);
 const legacy=word.replace(tag,"{{ROW:MEMBERS_ACTIVE}}");
 assert.match(expandWordTablesXml(legacy,{MEMBERS_ACTIVE:records}).xml,/Zoé/);
});
test("PowerPoint table and text box apply the same SORT priority",()=>{
 const table='<a:tbl><a:tr><a:tc><a:txBody><a:p><a:r><a:t>'+
  tag+'{{MEMBER_NAME}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl>';
 const xml=expandPowerPointTablesXml(table,{MEMBERS_ACTIVE:records}).xml;
 assertOrder(xml,["Zoé","Bob","Alice"]);
 const shape='<p:sp><p:txBody><a:p><a:r><a:t>'+
  tag+'{{MEMBER_NAME}}</a:t></a:r></a:p></p:txBody></p:sp>';
 const ppt=expandPowerPointTextBoxesXml(shape,{MEMBERS_ACTIVE:records}).xml;
 assertOrder(ppt,["Zoé","Bob","Alice"]);
 assert.doesNotMatch(ppt,/\{\{ROW:/);
});
test("Unsupported SORT tags fail explicitly, including split word and PowerPoint tags",()=>{
 const word='<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{ROW:RISKS|SORT=BAD:DOWN}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
 assert.throws(()=>expandWordTablesXml(word,{RISKS:records}),/invalid-sort/);
 const ppt='<a:tbl><a:tr><a:tc><a:txBody><a:p><a:r><a:t>{{ROW:RISKS|SORT=BAD:DOWN}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl>';
 assert.throws(()=>expandPowerPointTablesXml(ppt,{RISKS:records}),/invalid-sort/);
});
