import {test} from "node:test";
import assert from "node:assert/strict";
import {validateManualWrite,writeManualValues} from "../src/server/indicators/manual-values";
import type {Client} from "pg";
const baseline={teamId:"team-a",cycleType:"scrum" as const,cycleId:"sprint-a",expectedRevision:0,changes:[{indicatorId:"m1",value:"0"}]};
test("contrat strict : NULL distinct de zéro, valeur signée, précision fixe",()=>{
 for(const value of [null,"0","-1.25","+0.000000000000000000000001"])
  assert.equal(validateManualWrite({...baseline,changes:[{indicatorId:"m1",value}]}),true,String(value));
 for(const value of ["","1e2","NaN","Infinity","-","1,25","0.0000000000000000000000001","1;DROP TABLE x"])
  assert.equal(validateManualWrite({...baseline,changes:[{indicatorId:"m1",value}]}),false,value);
});
test("contrat strict : lot borné, identifiants uniques, révision non négative",()=>{
 assert.equal(validateManualWrite({...baseline,expectedRevision:-1}),false);
 assert.equal(validateManualWrite({...baseline,expectedRevision:1.1}),false);
 assert.equal(validateManualWrite({...baseline,changes:[]}),false);
 assert.equal(validateManualWrite({...baseline,changes:[{indicatorId:"m1",value:"1"},{indicatorId:"m1",value:"2"}]}),false);
 assert.equal(validateManualWrite({...baseline,changes:Array.from({length:101},(_,i)=>({indicatorId:String(i),value:null}))}),false);
 assert.equal(validateManualWrite({...baseline,cycleType:"invalid" as "scrum"}),false);
});
test("entrée invalide refusée avant toute écriture SQL",async()=>{
 let calls=0;
 const db={query:async()=>{calls++;throw Error("SQL not expected")}} as unknown as Client;
 assert.deepEqual(await writeManualValues(db,"admin",{...baseline,changes:[{indicatorId:"x",value:"1e2"}]}),{ok:false,error:"invalid-input"});
 assert.deepEqual(await writeManualValues(db,"",baseline),{ok:false,error:"invalid-input"});
 assert.equal(calls,0);
});
