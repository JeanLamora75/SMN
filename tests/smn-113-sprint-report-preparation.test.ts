import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {prepareSprintReport} from "../src/server/reports/sprint-preparation";
const id="11111111-1111-4111-8111-111111111111";
const sprint={id,name:"Sprint A",status:"active",teamId:"team",team:"Equipe",product:"Produit",startAt:"2026-10-19",endAt:"2026-10-30",timeZone:"Europe/Paris"};
test("Sprint non clôturé : données actuelles, caractère provisoire et aucune écriture",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);
  if(q.includes("FROM public.smn_sprint s"))return {rows:[sprint]};
  if(q.includes("to_regclass"))return {rows:[{goals:true,closures:true}]};
  if(q.includes("FROM public.smn_sprint_goal"))return {rows:[{id:"goal",title:"Objectif",evaluation:"not_evaluated"}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await prepareSprintReport(db,id);
 assert.equal(result?.provisional,true);assert.equal(result?.template,"standard");
 assert.equal(result?.goals.length,1);
 assert.equal(sql.every(q=>!/\b(?:INSERT|UPDATE|DELETE|CREATE\s+TABLE)\b/i.test(q)),true);
});
test("Sprint clôturé sans snapshot : ne pas inventer des objectifs",async()=>{
 const db={query:async(q:string)=>q.includes("FROM public.smn_sprint s")?{rows:[{...sprint,status:"closed"}]}:
  q.includes("to_regclass")?{rows:[{goals:true,closures:true}]}:{rows:[]}} as unknown as Client;
 const result=await prepareSprintReport(db,id);
 assert.equal(result?.provisional,false);
 assert.equal(result?.source,"historical-data-unavailable");
 assert.deepEqual(result?.goals,[]);
});
