import assert from "node:assert/strict";
import {test} from "node:test";
import {projectBriefSelection,type BriefFact} from "../src/server/ai-briefs/facts";

const item:BriefFact={key:"kanban.throughput",label:"Throughput",value:"0",unit:"items",source:"closure",quality:"recorded",snapshotVersion:3};
test("a true zero remains different from a missing value",()=>{
 const missing:BriefFact={...item,key:"kanban.wip",value:null,quality:"unavailable"};
 const projection=projectBriefSelection("kanban",["kanban.throughput","kanban.wip"],{"kanban.throughput":item,"kanban.wip":missing});
 assert.equal(projection[0].value,"0");assert.equal(projection[1].value,null);
 assert.equal(projection[0].snapshotVersion,3);
});
test("private fields and Scrum metrics do not enter Kanban",()=>{
 const values=projectBriefSelection("kanban",["member.email","scrum.storyPoints.completed","kanban.throughput"],{"kanban.throughput":item,"member.email":item});
 assert.deepEqual(values,[item]);
});
