import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseQuickMembersRequest,initialAgileRole,createQuickMembers,listTeamMembers} from "../src/server/members/quick-create";
import {MEMBERS_MIGRATION_SQL} from "../src/server/members/migration";

const input=()=>({teamId:"team",count:5,requestId:randomUUID()});
function fixture(options:{existing?:number;failAt?:number;batch?:boolean;referenceCountry?:string|null}={}){
 const sql:string[]=[],params:unknown[][]=[];let insertion=0;
 const db={query:async(query:string,values:unknown[]=[])=>{
  sql.push(query);params.push(values);
  if(query.includes("CURRENT_DATE::text AS today"))return {rowCount:1,rows:[{today:"2026-10-21"}]};
  if(query.includes("SELECT reference_country FROM public.smn_general_settings"))
   return {rowCount:1,rows:[{reference_country:options.referenceCountry??null}]};
  if(query.includes("FROM public.smn_team t")&&!query.includes("FROM public.smn_member m"))return {rowCount:1,rows:[{team_id:"team",team_name:"Produit Scrum",mode:"scrum"}]};
  if(query.includes("FROM public.smn_member_batch WHERE id="))
   return options.batch?{rowCount:1,rows:[{id:values[0],team_id:"team",requested_count:5,created_by:"admin"}]}:{rowCount:0,rows:[]};
  if(query.includes("count(*)::int AS count FROM public.smn_member"))
   return {rowCount:1,rows:[{count:options.existing??0}]};
  if(query.includes("INSERT INTO public.smn_member\n")){
   insertion++;
   if(options.failAt===insertion)throw new Error("fixture-insertion-failed");
   return {rowCount:1,rows:[]};
  }
  if(query.includes("FROM public.smn_member m")&&query.includes("FROM public.smn_member_assignment a")){
   if(options.batch){
    const rows=Array.from({length:5},(_,i)=>({
     id:randomUUID(),member_number:i+1,display_name:"Membre "+(i+1),
     is_provisional:true,agile_role:initialAgileRole(i),start_on:"2026-10-21",
     contract_percent:100,allocation_percent:100,role_percent:100,contribution_percent:100
    }));
    return {rowCount:5,rows};
   }
   return {rowCount:0,rows:[]};
  }
  return {rowCount:1,rows:[]};
 }} as unknown as Client;
 return {db,sql,params};
}
describe("Création rapide des membres initiaux",()=>{
 it("applique 3 par défaut en UI et bloque strictement les nombres invalides côté serveur",()=>{
  assert.equal(parseQuickMembersRequest(input())?.count,5);
  for(const count of [0,1,2,-1,3.2,"3",51,null,NaN]){
   assert.equal(parseQuickMembersRequest({...input(),count}),null);
  }
  assert.equal(parseQuickMembersRequest({...input(),teamId:"other"} )?.teamId,"other");
  assert.equal(parseQuickMembersRequest({...input(),requestId:"not-uuid"}),null);
  assert.equal(parseQuickMembersRequest({...input(),secret:"oops"}),null);
 });
 it("assigne Scrum Master puis Product Owner puis uniquement développeur",()=>{
  assert.deepEqual(Array.from({length:5},(_,i)=>initialAgileRole(i)),
   ["scrum_master","product_owner","developer","developer","developer"]);
 });
 it("prévoit centralité, unicité, affectation datée, pourcentages et aucune capacité pré-calculée",()=>{
  assert.match(MEMBERS_MIGRATION_SQL,/CREATE TABLE public.smn_member\s*\(/);
  assert.match(MEMBERS_MIGRATION_SQL,/CREATE TABLE public.smn_member_assignment\s*\(/);
  assert.match(MEMBERS_MIGRATION_SQL,/UNIQUE\s*\(installation_id,member_number\)/);
  assert.match(MEMBERS_MIGRATION_SQL,/contract_percent integer NOT NULL DEFAULT 100/);
  assert.match(MEMBERS_MIGRATION_SQL,/allocation_percent integer NOT NULL DEFAULT 100/);
  assert.match(MEMBERS_MIGRATION_SQL,/role_percent integer NOT NULL DEFAULT 100/);
  assert.doesNotMatch(MEMBERS_MIGRATION_SQL,/developer_capacity|sprint_kpi|cycle_kpi/);
 });
 it("crée 5 personnes et 5 affectations sans compte applicatif",async()=>{
  const {db,sql,params}=fixture();
  const result=await createQuickMembers(db,"admin",input());
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.members.length,5);assert.equal(result.created,true);
   assert.deepEqual(result.members.map(m=>m.agileRole),
    ["scrum_master","product_owner","developer","developer","developer"]);
   assert.deepEqual(result.members.map(m=>m.memberNumber),[1,2,3,4,5]);
   assert.ok(result.members.every(m=>m.contractPercent===100&&m.allocationPercent===100&&m.rolePercent===100&&m.contributionPercent===100));
   assert.ok(result.members.every(m=>m.developmentCapacityJh===null));
  }
  assert.equal(sql.filter(x=>x.includes("INSERT INTO public.smn_member\n")).length,5);
  assert.equal(sql.filter(x=>x.includes("INSERT INTO public.smn_member_assignment\n")).length,5);
  assert.equal(sql.filter(x=>x.includes("INSERT INTO public.smn_member_assignment_version")).length,5);
  assert.equal(sql.at(-1),"COMMIT");
  assert.ok(sql.every(q=>!q.includes("INSERT INTO public.smn_account")));
  assert.equal(params.find((v,i)=>sql[i].includes("INSERT INTO public.smn_member_batch"))?.[2],5);
 });
 it("propose et enregistre le pays installé par membre sans créer de fuseau fictif",async()=>{
  const {db,sql,params}=fixture({referenceCountry:"FR"});
  const result=await createQuickMembers(db,"admin",input());
  assert.equal(result.ok,true);
  const locationSql=sql.filter(q=>q.includes("INSERT INTO public.smn_member_location"));
  assert.equal(locationSql.length,5);
  const inserts=params.filter((_,i)=>sql[i].includes("INSERT INTO public.smn_member_location"));
  assert.ok(inserts.every(v=>v[3]==="FR"&&v.length===5));
  assert.ok(sql.every(q=>!q.includes("UPDATE public.smn_general_settings")));
 });
 it("ne fabrique pas de pays ou fuseau lorsque l'installation n'en propose aucun",async()=>{
  const {db,sql}=fixture();
  assert.equal((await createQuickMembers(db,"admin",input())).ok,true);
  assert.equal(sql.filter(q=>q.includes("INSERT INTO public.smn_member_location")).length,0);
 });
 it("refuse de réinitialiser une équipe possédant déjà des membres",async()=>{
  const {db,sql}=fixture({existing:3});
  const result=await createQuickMembers(db,"admin",input());
  assert.deepEqual(result,{ok:false,error:"already-initialized"});
  assert.equal(sql.some(s=>s.includes("INSERT INTO public.smn_member\n")),false);
  assert.equal(sql.at(-1),"ROLLBACK");
 });
 it("sur erreur de lot, effectue un rollback et ne renvoie pas de succès",async()=>{
  const {db,sql}=fixture({failAt:3});
  await assert.rejects(()=>createQuickMembers(db,"admin",input()),/fixture-insertion-failed/);
  assert.ok(sql.includes("ROLLBACK"));assert.ok(!sql.includes("COMMIT"));
 });
 it("un second appel avec la même clé renvoie le lot existant sans nouvelles créations",async()=>{
  const {db,sql}=fixture({batch:true,existing:5});
  const result=await createQuickMembers(db,"admin",input());
  assert.equal(result.ok,true);
  if(result.ok)assert.equal(result.created,false);
  assert.equal(sql.some(s=>s.includes("INSERT INTO public.smn_member\n")),false);
 });
 it("lecture uniquement de l'équipe singleton, sans données de compte",async()=>{
  const {db,sql}=fixture();
  const state=await listTeamMembers(db);
  assert.equal(state.team.id,"team");
  assert.deepEqual(state.members,[]);
  assert.ok(sql.some(q=>q.includes("WHERE i.id='singleton'")));
 });
});
