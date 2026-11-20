import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {initialTrendRows,nextTrendRow,validTrendRows} from "../src/lib/indicators/trend-config";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const cols=Array.from({length:7},(_,i)=>({id:"i"+i,tag:"tag"+i,name:"Indicateur "+i,unit:i%2?"SP":"JH"}));

test("SMN trends cockpit: only one indicator and a bar chart selected initially",()=>{
 const rows=initialTrendRows(cols);
 assert.deepEqual(rows,[{key:0,indicatorId:"i0",style:"bar"}]);
 assert.deepEqual(initialTrendRows([]),[]);
 assert.equal(validTrendRows(rows,cols),true);
});
test("SMN trends cockpit: add no more than five distinct indicators",()=>{
 let rows=initialTrendRows(cols);
 for(let i=1;i<5;i++)rows=nextTrendRow(rows,cols);
 assert.equal(rows.length,5);
 assert.deepEqual(rows.map(r=>r.indicatorId),["i0","i1","i2","i3","i4"]);
 assert.deepEqual(nextTrendRow(rows,cols),rows);
 assert.equal(validTrendRows(rows,cols),true);
 assert.equal(validTrendRows([...rows,{key:6,indicatorId:"i6",style:"bar"}],cols),false);
 assert.equal(validTrendRows([{key:0,indicatorId:"i0",style:"bar"},{key:1,indicatorId:"i0",style:"line"}],cols),false);
 assert.equal(validTrendRows([{key:0,indicatorId:"i0",style:"unknown" as "bar"}],cols),false);
});
test("SMN trends cockpit: each row has an individual style and remove action",()=>{
 const source=read("src/app/app/admin/indicators/indicator-trends.tsx");
 assert.match(source,/rows\.map\(\(row,index\)=>/);
 assert.match(source,/changeRow\(row\.key,\{style:event\.target\.value as Style\}\)/);
 assert.match(source,/onClick=\{\(\)=>removeRow\(row\.key\)\}/);
 assert.match(source,/onClick=\{addRow\}/);
 assert.match(source,/borderStyle:"dashed"/);
 assert.match(source,/canAdd&&/);
 assert.match(source,/setApplied\(\{rows:rows\.map\(row=>\(\{\.\.\.row\}\)\),start,end\}\)/);
 assert.match(source,/selected\.map\(\(\{column\}\)=>/);
 assert.match(source,/type:chartStyle,locale/);
 assert.match(source,/seriesTypes:chartTypes/);
});
