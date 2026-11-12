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
