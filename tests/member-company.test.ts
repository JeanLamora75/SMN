import assert from "node:assert/strict";
import test from "node:test";
import type {Client} from "pg";
import {parseCompanyMemberRequest,createCompanyMember} from "../src/server/members/company-create";
import {withMemberCompanies} from "../src/server/members/company-presentation";

const req="10ae30ef-2562-4459-a276-010102030405";
const company="9b5e17ad-c346-4af8-9284-bb9b47706234";
test("entreprise facultative uniquement à la création",()=>{
 assert.equal(parseCompanyMemberRequest({requestId:req,teamId:"team1",displayName:"Alice"})?.companyId,null);
 assert.equal(parseCompanyMemberRequest({requestId:req,teamId:"team1",displayName:"Alice",companyId:company})?.companyId,company);
 assert.equal(parseCompanyMemberRequest({requestId:req,teamId:"team1",displayName:"Alice",companyId:"bad"}),null);
 assert.equal(parseCompanyMemberRequest({requestId:req,teamId:"team1",displayName:"Alice",companyId:company,transfer:true}),null);
});
test("sélection d'une entreprise archivée refusée et transaction annulée",async()=>{
 const queries:string[]=[];
 const db={query:async(q:string)=>{
  queries.push(q);
  if(q.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:31}]};
  if(q.includes("FROM public.smn_account_team_preference"))return {rows:[]};
  if(q.includes("FROM information_schema.columns"))return {rows:[{name:"agile_mode"},{name:"is_archived"}]};
  if(q.includes("FROM public.smn_team t")&&q.includes("product_id"))return {rows:[{team_id:"team1",team:"Test",mode:"scrum",product_id:null,product:null}]};
  if(q.includes("FROM public.smn_member m"))return {rows:[]};
  if(q.includes("FROM public.smn_company"))return {rows:[]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await createCompanyMember(db,"admin",{requestId:req,teamId:"team1",displayName:"Alice",companyId:company});
 assert.deepEqual(result,{ok:false,error:"company-unavailable"});
 assert.ok(queries.includes("ROLLBACK"));
 assert.equal(queries.some(q=>q.includes("INSERT INTO public.smn_member")),false);
});
test("projection de l'entreprise seulement pour les membres déjà visibles",async()=>{
 const calls:unknown[]=[];
 const db={query:async(_q:string,args:unknown[])=>{calls.push(args[0]);return {rows:[
  {id:req,company_id:company,company_name:"Acme",company_color:"blue"}]};}} as unknown as Client;
 const data={team:{id:"team1",name:"Test",mode:"scrum"},members:[{id:req,displayName:"Alice"}]} as Parameters<typeof withMemberCompanies>[1];
 const result=await withMemberCompanies(db,data);
 assert.equal(result.members[0].companyId,company);
 assert.deepEqual(calls[0],[req]);
});
