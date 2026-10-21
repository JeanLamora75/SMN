import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseMemberProfileChange,updateMemberProfile} from "../src/server/members/profile";
import {MEMBER_PROFILE_MIGRATION_SQL} from "../src/server/members/profile-migration";

const id=randomUUID();
const valid={displayName:"Camille Martin",email:"camille+agile@example.org",revision:0};
const existing={id,display_name:"Membre 2",email:null,is_provisional:true,revision:0,member_number:2};
function mock(options:{current?:typeof existing|null;updateFails?:boolean}={}){
 const queries:string[]=[],params:unknown[][]=[];
 const current=options.current===undefined?existing:options.current;
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push(sql);params.push(args);
  if(sql.includes("SELECT id,display_name,email,is_provisional,revision,member_number")&&sql.includes("FOR UPDATE"))
   return {rows:current?[current]:[],rowCount:current?1:0};
  if(sql.includes("UPDATE public.smn_member SET")){
   if(options.updateFails)throw new Error("sql-failure");
   return {rows:[{...current,id,display_name:args[0],email:args[1],is_provisional:args[2],revision:1,member_number:2}],rowCount:1};
  }
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,queries,params};
}
describe("Fiche membre centrale et email facultatif",()=>{
 it("valide strictement nom, email nullable et révision",()=>{
  assert.deepEqual(parseMemberProfileChange(valid),valid);
  assert.deepEqual(parseMemberProfileChange({...valid,email:"  "}),{...valid,email:null});
  assert.deepEqual(parseMemberProfileChange({...valid,email:null}),{...valid,email:null});
  for(const email of ["not-an-email","x@", "@domain.fr","a b@domain.fr","a@domain",
    "a@example.org\r\nX: injected", "x".repeat(255)+"@example.org",45]){
   assert.equal(parseMemberProfileChange({...valid,email}),null);
  }
  for(const displayName of ["","  ","x".repeat(121),"Camille\nDupont",25]){
   assert.equal(parseMemberProfileChange({...valid,displayName}),null);
  }
  assert.equal(parseMemberProfileChange({...valid,revision:-1}),null);
  assert.equal(parseMemberProfileChange({...valid,revision:"0"}),null);
  assert.equal(parseMemberProfileChange({...valid,unexpected:"no"}),null);
 });
 it("conserve identifiant/affectations et confirme un nom réel",async()=>{
  const {db,queries,params}=mock();
  const result=await updateMemberProfile(db,id,valid);
  assert.equal(result.ok,true);
  if(result.ok){
   assert.equal(result.member.id,id);
   assert.equal(result.member.displayName,"Camille Martin");
   assert.equal(result.member.isProvisional,false);
   assert.equal(result.member.email,"camille+agile@example.org");
   assert.equal(result.member.revision,1);
  }
  assert.equal(queries.at(-1),"COMMIT");
  assert.ok(queries.some(q=>q.includes("UPDATE public.smn_member SET")));
  assert.ok(queries.every(q=>!q.includes("UPDATE public.smn_member_assignment")&&
   !q.includes("INSERT INTO public.smn_account")));
  assert.deepEqual(params.find((_,i)=>queries[i].includes("UPDATE public.smn_member SET"))?.slice(0,3),
   ["Camille Martin","camille+agile@example.org",false]);
 });
 it("ajout d'un email ne confirme pas un nom provisoire inchangé",async()=>{
  const {db}=mock();
  const result=await updateMemberProfile(db,id,{
   displayName:"Membre 2",email:"prenom.nom@example.fr",revision:0
  });
  assert.equal(result.ok,true);
  if(result.ok){
   assert.equal(result.member.isProvisional,true);
   assert.equal(result.member.email,"prenom.nom@example.fr");
   assert.equal(result.member.displayName,"Membre 2");
  }
 });
 it("email seul conserve l'état provisoire ; email vide efface sans créer de compte",async()=>{
  const {db}=mock();
  const result=await updateMemberProfile(db,id,{displayName:"Membre 2",email:"  ",revision:0});
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.member.isProvisional,true);assert.equal(result.member.email,null);}
 });
 it("fiche déjà confirmée reste confirmée après correction",async()=>{
  const {db}=mock({current:{...existing,display_name:"Camille",is_provisional:false}});
  const result=await updateMemberProfile(db,id,{displayName:"Camille M.",email:null,revision:0});
  assert.equal(result.ok,true);
  if(result.ok)assert.equal(result.member.isProvisional,false);
 });
 it("refuse conflit et identifiant inconnu sans mutation",async()=>{
  const stale=mock({current:{...existing,revision:2}});
  assert.deepEqual(await updateMemberProfile(stale.db,id,valid),{ok:false,error:"conflict"});
  assert.equal(stale.queries.at(-1),"ROLLBACK");
  assert.ok(!stale.queries.some(q=>q.includes("UPDATE public.smn_member SET")));
  const missing=mock({current:null});
  assert.deepEqual(await updateMemberProfile(missing.db,id,valid),{ok:false,error:"not-found"});
  assert.deepEqual(await updateMemberProfile(missing.db,"../../other",valid),{ok:false,error:"invalid-input"});
 });
 it("sur défaillance SQL, rollback sans succès",async()=>{
  const {db,queries}=mock({updateFails:true});
  await assert.rejects(()=>updateMemberProfile(db,id,valid),/sql-failure/);
  assert.equal(queries.at(-1),"ROLLBACK");
 });
 it("migration additive pour email nullable, état provisoire et contrôle de révision",()=>{
  assert.match(MEMBER_PROFILE_MIGRATION_SQL,/ADD COLUMN email text/);
  assert.match(MEMBER_PROFILE_MIGRATION_SQL,/ADD COLUMN revision integer NOT NULL DEFAULT 0/);
  assert.match(MEMBER_PROFILE_MIGRATION_SQL,/schema_version=10/);
  assert.doesNotMatch(MEMBER_PROFILE_MIGRATION_SQL,/DROP TABLE|smn_account.*INSERT/i);
 });
});
