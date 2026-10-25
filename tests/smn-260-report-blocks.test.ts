import test from "node:test";
import assert from "node:assert/strict";
import {moveItem,isReportBlock,visibleBlocks,type ReportBlock} from "../src/lib/report-studio-blocks";
const block:ReportBlock={id:"11111111-1111-4111-8111-111111111111",sectionKey:"executive",kind:"text",title:"Bilan",visible:true,width:"full",text:"Texte équipe",metricKey:null,imageUrl:null};
test("block validation accepts typed document block",()=>assert.equal(isReportBlock(block),true));
test("reorder returns a new array, never mutating original",()=>{
 const source=["executive","objectives","indicators"];
 assert.deepEqual(moveItem(source,1,-1),["objectives","executive","indicators"]);
 assert.deepEqual(source,["executive","objectives","indicators"]);
 assert.deepEqual(moveItem(source,0,-1),source);
});
test("hidden blocks remain stored and are excluded from display",()=>{
 const hidden={...block,id:"22222222-2222-4222-8222-222222222222",visible:false};
 const rows=[block,hidden];assert.deepEqual(visibleBlocks(rows,"executive"),[block]);assert.equal(rows.length,2);
});
