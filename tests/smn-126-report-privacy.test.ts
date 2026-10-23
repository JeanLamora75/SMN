import test from "node:test";
import assert from "node:assert/strict";
import {safeCollectiveContext,safeCollectiveItems,projectCollectiveFacts,reportExportAllowed} from "../src/lib/report-privacy";
test("member emails and individual absence details never appear in collective context",()=>{
 const raw={id:"1",name:"Sprint",team:"Equipe",product:"Produit",startAt:"2026-10-01",endAt:"2026-10-14",status:"closed",timeZone:"Europe/Paris",email:"secret@example.org",individualCapacityJh:7,absenceName:"Private"};
 const safe=safeCollectiveContext(raw);
 assert.equal("email" in safe,false);
 assert.equal("individualCapacityJh" in safe,false);
 assert.equal("absenceName" in safe,false);
});
test("qualitative fact allows only necessary business owner; hidden and invalidated excluded",()=>{
 const facts=[{id:"1",title:"Action",status:"open",ownerName:"Alice",email:"secret@example.org"},
 {id:"2",title:"Hidden",status:"open",hidden:true,ownerName:"Bob"},
 {id:"3",title:"Invalid",status:"open",invalidated:true}];
 const output=projectCollectiveFacts(facts,true);
 assert.deepEqual(output,[{id:"1",title:"Action",status:"open",ownerName:"Alice"}]);
 assert.equal("email" in output[0],false);
});
test("no AI TXT through report export authorization",()=>{
 assert.equal(reportExportAllowed("html"),true);
 assert.equal(reportExportAllowed("pdf"),true);
 assert.equal(reportExportAllowed("txt"),false);
 assert.equal(reportExportAllowed("ai-brief"),false);
});
test("list entries explicitly remove extra private fields",()=>{
 const source=[{label:"item",detail:"status",href:null,email:"secret@example.org"}];
 const items=safeCollectiveItems(source);
 assert.equal("email" in items[0],false);
});
