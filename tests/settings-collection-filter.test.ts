import assert from "node:assert/strict";
import {test} from "node:test";
import {filterSettingsTeams,filterSettingsAbsences,filterSettingsUsers,filterSettingsCeremonies} from "../src/lib/settings-collection-filter";

test("team filters search product names and respect active/archive status",()=>{
 const teams=[
  {id:"one",name:"Equipe Alpha",productName:"Mon Portail",isArchived:false},
  {id:"two",name:"Equipe Beta",productName:"Support",isArchived:true}
 ];
 assert.deepEqual(filterSettingsTeams(teams,"  PORTAIL ","all").map(x=>x.id),["one"]);
 assert.deepEqual(filterSettingsTeams(teams,"","archived").map(x=>x.id),["two"]);
 assert.equal(teams.length,2);
});
test("absence categories filter by name and preserved active flag",()=>{
 const categories=[{id:"s",name:"Congés",isActive:true},{id:"a",name:"Ancien",isActive:false}];
 assert.deepEqual(filterSettingsAbsences(categories,"cong","active").map(x=>x.id),["s"]);
 assert.deepEqual(filterSettingsAbsences(categories,"","inactive").map(x=>x.id),["a"]);
});
test("user filters search by email, role and active state without changing drafts",()=>{
 const users=[
  {id:"1",username:"Admin",email:"admin@example.org",role:"admin" as const,is_active:true},
  {id:"2",username:"Guest",email:"guest@example.org",role:"user" as const,is_active:false}
 ];
 assert.deepEqual(filterSettingsUsers(users,"example","active","admin").map(x=>x.id),["1"]);
 assert.deepEqual(filterSettingsUsers(users,"guest@","inactive","user").map(x=>x.id),["2"]);
 assert.equal(filterSettingsUsers(users,"","inactive","admin").length,0);
});
test("a previously selected ceremony remains selectable after changing filters",()=>{
 const templates=[
  {id:"daily",name:"Daily",active:true},
  {id:"review",name:"Revue",active:false},
  {id:"retro",name:"Rétro",active:true}
 ];
 assert.deepEqual(filterSettingsCeremonies(templates,"rét","active","review").map(x=>x.id),["review","retro"]);
 assert.deepEqual(filterSettingsCeremonies(templates,"nothing","inactive","").map(x=>x.id),[]);
});

test("filtering catalogues does not mutate source records or alter their order",()=>{
 const teams=[
  {id:"a",name:"Équipe Alpha",productName:"Portail",isArchived:false},
  {id:"b",name:"Équipe Beta",productName:null,isArchived:true},
  {id:"c",name:"Équipe Gamma",productName:"Portail Mobile",isArchived:false}
 ];
 const before=JSON.stringify(teams);
 assert.deepEqual(filterSettingsTeams(teams,"portail","active").map(x=>x.id),["a","c"]);
 assert.deepEqual(filterSettingsTeams(teams,"BETA","all").map(x=>x.id),["b"]);
 assert.deepEqual(filterSettingsTeams(teams,"","active").map(x=>x.id),["a","c"]);
 assert.deepEqual(filterSettingsTeams(teams,"","all").map(x=>x.id),["a","b","c"]);
 assert.equal(JSON.stringify(teams),before);
});
test("searches are case-insensitive, trim whitespace and preserve active status",()=>{
 const absences=[
  {id:"a",name:"Congé maternité",isActive:true},
  {id:"b",name:"Congé exceptionnel",isActive:false},
  {id:"c",name:"Formation",isActive:true}
 ];
 assert.deepEqual(filterSettingsAbsences(absences,"  CONGÉ  ","all").map(x=>x.id),["a","b"]);
 assert.deepEqual(filterSettingsAbsences(absences,"congé","inactive").map(x=>x.id),["b"]);
 assert.deepEqual(filterSettingsAbsences(absences,"","active").map(x=>x.id),["a","c"]);
 const users=[
  {username:"Alpha",email:"alpha@example.test",role:"admin" as const,is_active:true},
  {username:"Beta",email:"beta@example.test",role:"admin" as const,is_active:false},
  {username:"Gamma",email:"gamma@example.test",role:"user" as const,is_active:true}
 ];
 assert.deepEqual(filterSettingsUsers(users,"  EXAMPLE.TEST ","all","admin").map(x=>x.username),["Alpha","Beta"]);
 assert.deepEqual(filterSettingsUsers(users,"","active","user").map(x=>x.username),["Gamma"]);
 assert.deepEqual(filterSettingsUsers(users,"beta","active","all"),[]);
});
test("selected ceremony is shown exactly once even when filtered out",()=>{
 const templates=[
  {id:"daily",name:"Daily",active:true},
  {id:"review",name:"Review",active:false},
  {id:"retro",name:"Retrospective",active:true}
 ];
 assert.deepEqual(filterSettingsCeremonies(templates,"daily","active","review").map(x=>x.id),["daily","review"]);
 assert.deepEqual(filterSettingsCeremonies(templates,"review","inactive","review").map(x=>x.id),["review"]);
 assert.deepEqual(filterSettingsCeremonies(templates,"nothing","active","unknown").map(x=>x.id),[]);
 assert.deepEqual(filterSettingsCeremonies(templates,"","all","review").map(x=>x.id),["daily","review","retro"]);
});
