import assert from "node:assert/strict";
import test from "node:test";
import type {Client} from "pg";
import {parseCompanyClosure,saveCompanyClosureV31,listClosuresForCompany} from "../src/server/closures/company-service";
const company="9b5e17ad-c346-4af8-9284-bb9b47706234";
const closure="10ae30ef-2562-4459-a276-010102030405";
const create={action:"create",companyId:company,name:"Fermeture annuelle",startOn:"2026-12-24",endOn:"2026-12-31"};
test("entrée valide et jours entiers uniquement",()=>{
 assert.equal(parseCompanyClosure(create)?.companyId,company);
 assert.equal(parseCompanyClosure({...create,startOn:"2026-02-30"}),null);
 assert.equal(parseCompanyClosure({...create,endOn:"2026-12-23"}),null);
 assert.equal(parseCompanyClosure({...create,startOn:"2026-12-24T12:00:00"}),null);
 assert.equal(parseCompanyClosure({...create,teamId:"team"}),null);
 assert.equal(parseCompanyClosure({...create,companyId:"invalid"}),null);
 assert.equal(parseCompanyClosure({...create,action:"update",id:closure,revision:0,isActive:true}),null);
});
test("chevauchement provoque rollback et zéro écriture",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("to_regclass")&&sql.includes("smn_company_capacity_recalc"))return {rows:[{ready:true}]};
  if(sql.includes("FROM public.smn_company\n"))return {rows:[{id:company}]};
  if(sql.includes("WHERE company_id=$1 AND is_active=true"))return {rows:[{id:closure}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await saveCompanyClosureV31(db,"admin",create);
 assert.deepEqual(result,{ok:false,error:"overlap"});
 assert.ok(statements.includes("ROLLBACK"));
 assert.equal(statements.some(x=>x.includes("INSERT INTO public.smn_company_closure\n")),false);
});
test("entreprise inexistante bloque création",async()=>{
 const commands:string[]=[];
 const db={query:async(sql:string)=>{commands.push(sql);return sql.includes("to_regclass")?{rows:[{ready:true}]}:{rows:[]};}} as unknown as Client;
 assert.deepEqual(await saveCompanyClosureV31(db,"admin",create),{ok:false,error:"company-not-found"});
 assert.ok(commands.includes("ROLLBACK"));
});
test("la liste est bornée à une entreprise",async()=>{
 let lastSql="",args:unknown[]=[];
 const db={query:async(sql:string,p:unknown[]=[])=>{
  lastSql=sql;args=p;
  return sql.includes("FROM public.smn_company WHERE")?{rows:[{id:company}]}:{rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await listClosuresForCompany(db,company),[]);
 assert.match(lastSql,/company_id=\$1/);
 assert.deepEqual(args,[company]);
});
