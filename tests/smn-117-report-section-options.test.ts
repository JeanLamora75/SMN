import test from "node:test";
import assert from "node:assert/strict";
import {defaultSectionOptions,validSectionOptions,orderReportSections} from "../src/lib/report-section-options";
test("six rubriques visibles par défaut et ordre standard",()=>{
 const options=defaultSectionOptions();assert.equal(options.length,6);
 assert.ok(options.every(x=>x.visible));assert.equal(validSectionOptions(options),true);
});
test("masquage et déplacement appliqués sans altérer les sources",()=>{
 const source=[{key:"executive" as const,value:1},{key:"objectives" as const,value:2},{key:"indicators" as const,value:3}];
 const options=defaultSectionOptions();options.reverse();options.find(x=>x.key==="objectives")!.visible=false;
 assert.deepEqual(orderReportSections(source,options).map(x=>x.key),["indicators","executive"]);
 assert.equal(source.length,3);
});
test("doublons ou rubrique étrangère refusés",()=>{
 const options=defaultSectionOptions();options[1]={...options[0]};
 assert.equal(validSectionOptions(options),false);
 assert.equal(validSectionOptions([...defaultSectionOptions(),{key:"fake",visible:true}]),false);
});
