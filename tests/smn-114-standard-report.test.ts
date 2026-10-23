import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {composeStandardReport,standardReportSections} from "../src/server/reports/standard-composition";
test("ordre exact des six sections standard",()=>{
 assert.deepEqual([...standardReportSections],["executive","objectives","indicators","events","attention","decisions"]);
});
test("sources absentes : aucune donnée inventée et aucune écriture",async()=>{
 const queries:string[]=[];
 const db={query:async(sql:string)=>{queries.push(sql);
  if(sql.includes("FROM public.smn_sprint s"))return {rows:[{id:"11111111-1111-4111-8111-111111111111",name:"Sprint",status:"active",teamId:"team",team:"Equipe",product:"Produit",startAt:"2026-10-19",endAt:"2026-10-30",timeZone:"Europe/Paris"}]};
  if(sql.includes("to_regclass"))return {rows:[{goals:false,closures:false,points:false,tickets:false,ceremonies:false,links:false}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await composeStandardReport(db,"11111111-1111-4111-8111-111111111111");
 assert.equal(result?.sections.length,6);
 assert.equal(result?.sections.find(s=>s.key==="indicators")?.state,"unavailable");
 assert.ok(queries.every(q=>!/\b(INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)\b/i.test(q)));
});
