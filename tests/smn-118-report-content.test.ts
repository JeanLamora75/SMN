import test from "node:test";
import assert from "node:assert/strict";
import {defaultReportContentOptions,validReportContentOptions,projectSelectedMetrics,eligibleReportFact} from "../src/lib/report-content-options";
test("options strictes, sélections sans doublons",()=>{
 const options=defaultReportContentOptions();
 assert.equal(validReportContentOptions(options),true);
 assert.equal(validReportContentOptions({...options,metrics:["committedSp","committedSp"]}),false);
 assert.equal(validReportContentOptions({...options,metrics:["unknown"]}),false);
});
test("SP, JH et pourcentage ne se mélangent pas ; données manquantes null",()=>{
 const output=projectSelectedMetrics({committed:20,completed:12,planned:null,actual:null},defaultReportContentOptions());
 assert.equal(output.find(x=>x.key==="committedSp")?.unit,"SP");
 assert.equal(output.find(x=>x.key==="plannedJh")?.available,false);
 assert.equal(output.find(x=>x.key==="plannedJh")?.value,null);
 assert.equal(output.find(x=>x.key==="completionPercent")?.value,60);
 assert.equal(projectSelectedMetrics({committed:0,completed:0,planned:null,actual:null},defaultReportContentOptions()).find(x=>x.key==="completionPercent")?.value,null);
});
test("masqué, invalidé ou désélectionné jamais éligible",()=>{
 const options=defaultReportContentOptions();
 assert.equal(eligibleReportFact({type:"risk",hidden:true},options),false);
 assert.equal(eligibleReportFact({type:"highlight",invalidated:true},options),false);
 assert.equal(eligibleReportFact({type:"decision",selected:false},options),false);
 assert.equal(eligibleReportFact({type:"action",selected:true},options),true);
 options.qualitativeKinds=[];assert.equal(eligibleReportFact({type:"action"},options),false);
});
