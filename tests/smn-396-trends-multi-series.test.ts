import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MAX_TREND_SERIES,TREND_COLORS,trendNumbers,trendRange,trendSegments,validateTrendSelection} from "../src/lib/indicators/trend-series";

const cols=[
 {id:"a",name:"Tickets ouverts",tag:"TCK_INI",unit:"Tic"},
 {id:"b",name:"Tickets terminés",tag:"TCK_FIN",unit:"Tic"},
 {id:"c",name:"Story Points",tag:"SP_FIN",unit:"SP"},
 {id:"d",name:"Taux",tag:"TX",unit:"%"},
 {id:"e",name:"Tickets annulés",tag:"TCK_CAN",unit:"Tic"},
 {id:"f",name:"Tickets ajoutés",tag:"TCK_AJ",unit:"Tic"},
 {id:"g",name:"Tickets retirés",tag:"TCK_RET",unit:"Tic"},
 {id:"h",name:"Tickets reportés",tag:"TCK_REP",unit:"Tic"},
];
const cycles=[
 {id:"1",name:"Sprint 101",status:"closed",values:{a:"12",b:"0",c:"20"}},
 {id:"2",name:"Sprint 102",status:"closed",values:{a:null,b:"-3",c:"21"}},
 {id:"3",name:"Sprint 103",status:"active",values:{a:"20",b:"5",c:""}},
];
const source=readFileSync(new URL("../src/app/app/admin/indicators/indicator-trends.tsx",import.meta.url),"utf8");

test("SMN-396: selection 1–6, no mixed units or duplicate IDs",()=>{
 assert.equal(MAX_TREND_SERIES,6);
 assert.equal(validateTrendSelection(["a"],cols),null);
 assert.equal(validateTrendSelection(["a","b"],cols),null);
 assert.equal(validateTrendSelection(["a","b","e","f","g","h"],cols),null);
 assert.equal(validateTrendSelection([],cols),"empty");
 assert.equal(validateTrendSelection(["a","b","e","f","g","h","c"],cols),"limit");
 assert.equal(validateTrendSelection(["a","c"],cols),"mixed-unit");
 assert.equal(validateTrendSelection(["a","a"],cols),"unknown");
 assert.equal(validateTrendSelection(["unknown"],cols),"unknown");
 assert.equal(TREND_COLORS.length>=MAX_TREND_SERIES,true);
});
test("SMN-396: zero, null and missing observations remain distinct",()=>{
 assert.deepEqual(trendNumbers(cycles,"a"),[12,null,20]);
 assert.deepEqual(trendNumbers(cycles,"b"),[0,-3,5]);
 assert.deepEqual(trendNumbers(cycles,"c"),[20,21,null]);
 assert.deepEqual(trendSegments([1,null,0,2,null,-1]),[[0],[2,3],[5]]);
 assert.deepEqual(trendSegments([null,null]),[]);
 const extent=trendRange([[12,null,20],[0,-3,5]]);
 assert.equal(extent.min,-3);
 assert.equal(extent.max,20);
});
test("SMN-396: form multi-check, chart styles, legends, table and PNG",()=>{
 assert.match(source,/indicators\.map\(id=>report\?\.columns/);
 assert.match(source,/type="checkbox" checked=\{indicators\.includes\(column\.id\)\}/);
 assert.match(source,/validateTrendSelection\(indicators,report\.columns\)/);
 assert.match(source,/MAX_TREND_SERIES/);
 assert.match(source,/disabled=\{indicators\.length>1&&\["pie","donut","gauge"\]\.includes\(s\)\}/);
 assert.match(source,/series\.map\(\(item,j\)=>/);
 assert.match(source,/style==="bar"/);
 assert.match(source,/style==="area"/);
 assert.match(source,/trendSegments\(item\.values\)/);
 assert.match(source,/item\.column\.name\.length>39/);
 assert.match(source,/activeColumns\.map\(column=><th/);
 assert.match(source,/series\.map\(item=><td/);
 assert.match(source,/canvas\.height=1180/);
 assert.match(source,/rotate\(-45/);
});
