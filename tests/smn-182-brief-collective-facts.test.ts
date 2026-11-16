import assert from "node:assert/strict";
import {test} from "node:test";
import {allowedBriefFields} from "../src/lib/ai-brief-templates";
import {resolveBriefPrompt} from "../src/lib/ai-brief-tag-resolver";
import type {BriefFact} from "../src/server/ai-briefs/facts";
const item:BriefFact={key:"kanban.throughput",label:"Throughput",value:"0",unit:"items",source:"closure",quality:"recorded",snapshotVersion:3};
const context={id:"cycle-1",name:"Period A",team:"Team A",product:"Product A",status:"closed",startAt:"2026-11-01",endAt:"2026-11-14",timeZone:"Europe/Paris"};
test("zero collective value remains distinct from missing data",()=>{
 const value=resolveBriefPrompt({promptText:"{{ROW:INDICATORS}}",mode:"kanban",context,preparedAt:"2026-11-16",facts:{"kanban.throughput":item}});
 assert.equal(value.safe,true);
 assert.match(value.text,/Throughput: 0 items/);
 assert.match(value.text,/source: closure/);
 const missing=resolveBriefPrompt({promptText:"{{ROW:INDICATORS}}",mode:"kanban",context,preparedAt:"2026-11-16",facts:{"kanban.wip":{...item,value:null,quality:"unavailable"}}});
 assert.equal(missing.safe,false);
});
test("private fields and Scrum metrics never enter Kanban output",()=>{
 assert.deepEqual(allowedBriefFields("kanban",["member.email","scrum.storyPoints.completed","kanban.throughput"]),["kanban.throughput"]);
 const value=resolveBriefPrompt({promptText:"{{ROW:INDICATORS}}",mode:"kanban",context,preparedAt:"2026-11-16",facts:{"kanban.throughput":item,"member.email":{...item,key:"member.email",label:"Private email",value:"private@example.invalid"}}});
 assert.equal(value.safe,true);
 assert.doesNotMatch(value.text,/private@example|Private email/);
});
