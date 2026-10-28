import assert from "node:assert/strict";
import test from "node:test";
import type {Client} from "pg";
import {queueClosureRecalculation,claimRecalculation,finishRecalculation} from "../src/server/capacity/company-recalc-outbox";

const id="10ae30ef-2562-4459-a276-010102030405";
test("ancienne et nouvelle périodes sont couvertes par un seul job",async()=>{
 let params:unknown[]=[];
 const db={query:async(_sql:string,p:unknown[])=>{params=p;return {rows:[]};}} as unknown as Client;
 await queueClosureRecalculation(db,{companyId:id,closureId:id,revision:2,
  startOn:"2026-12-28",endOn:"2027-01-03",
  previousStartOn:"2026-12-20",previousEndOn:"2026-12-31"});
 assert.deepEqual(params.slice(-2),["2026-12-20","2027-01-03"]);
});
test("aucune demande disponible ne laisse la file inchangée",async()=>{
 const commands:string[]=[];
 const db={query:async(sql:string)=>{commands.push(sql);return {rows:[]};}} as unknown as Client;
 assert.equal(await claimRecalculation(db),null);
 assert.deepEqual(commands.slice(0,2),["BEGIN",commands[1]]);
 assert.equal(commands.at(-1),"COMMIT");
});
test("échec de worker conservé et réessayable",async()=>{
 let args:unknown[]=[];
 const db={query:async(_sql:string,p:unknown[])=>{args=p;return {rows:[]};}} as unknown as Client;
 await finishRecalculation(db,id,"worker-failed");
 assert.equal(args[1],"failed");
 assert.equal(args[2],"worker-failed");
});

test("un job terminé conserve la référence calculée",async()=>{
 let query="",args:unknown[]=[];
 const db={query:async(q:string,p:unknown[])=>{query=q;args=p;return {rows:[]};}} as unknown as Client;
 await finishRecalculation(db,id,undefined,{periods:[{teamId:"team-main",referenceJh:3}]});
 assert.equal(args[1],"done");
 assert.match(String(args[3]),/"referenceJh":3/);
 assert.match(query,/result=\$4::jsonb/);
});
test("consommation concurrente avec verrou SKIP LOCKED",async()=>{
 const queries:string[]=[];
 const db={query:async(q:string)=>{queries.push(q);return {rows:[]};}} as unknown as Client;
 await claimRecalculation(db);
 assert.ok(queries.some(q=>q.includes("FOR UPDATE SKIP LOCKED")));
});
