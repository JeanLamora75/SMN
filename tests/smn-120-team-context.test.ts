import test from "node:test";
import assert from "node:assert/strict";
import {defaultTeamContextOptions,selectedTeamContext,permittedContextUrl,validTeamContextOptions} from "../src/lib/report-team-context";
test("context hidden by default and no fabricated values",()=>{
 const opts=defaultTeamContextOptions();
 assert.equal(validTeamContextOptions(opts),true);
 const result=selectedTeamContext({vision:null,productGoal:null,dod:null,dor:null},opts);
 assert.deepEqual(result,[]);
});
test("original French text and external URL are not translated or asserted verified",()=>{
 const opts={vision:true,productGoal:false,dod:true,dor:false};
 const data={vision:{kind:"text" as const,value:"Notre vision",language:"fr",recordedAt:null},
  productGoal:null,dod:{kind:"url" as const,value:"https://example.org/dod",language:null,recordedAt:null},dor:null};
 assert.deepEqual(selectedTeamContext(data,opts).map(x=>x.value),["Notre vision","https://example.org/dod"]);
 assert.equal(permittedContextUrl("javascript:alert(1)"),false);
});
