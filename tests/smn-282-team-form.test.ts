import {test} from "node:test";
import assert from "node:assert/strict";
import {parseTeamCreate,parseTeamUpdate,normalizedTeamName} from "../src/lib/team-form";
test("nom d'équipe obligatoire",()=>{assert.equal(parseTeamCreate({name:" "}),null);});

test("création avec champs facultatifs",()=>{
 assert.deepEqual(parseTeamCreate({name:" Koala ",agileMode:"scrum",productName:" ",vision:" Objectif ",productGoal:null}),{
  name:"Koala",agileMode:"scrum",productName:null,vision:"Objectif",productGoal:null
 });
});
test("validation des formats",()=>{
 assert.equal(parseTeamCreate({name:"x".repeat(121)}),null);
 assert.equal(parseTeamCreate({name:"Koala",agileMode:"scrum",vision:"x".repeat(5001)}),null);
 assert.equal(parseTeamCreate({name:"Koala",agileMode:"scrum",installationId:"singleton"}),null);
});

test("mise à jour exige une révision et un identifiant valides",()=>{
 assert.deepEqual(parseTeamUpdate({teamId:"team_1",revision:0,name:"Panda",agileMode:"scrum",productName:null,vision:null,productGoal:null}),{
  teamId:"team_1",revision:0,name:"Panda",agileMode:"scrum",productName:null,vision:null,productGoal:null
 });
 assert.equal(parseTeamUpdate({teamId:"../team",revision:0,name:"Panda"}),null);
 assert.equal(parseTeamUpdate({teamId:"team",revision:-1,name:"Panda"}),null);
 assert.equal(parseTeamUpdate({teamId:"team",revision:"0",name:"Panda"}),null);
});
test("homonymies insensibles aux espaces et à la casse",()=>{
 assert.equal(normalizedTeamName("  ÉQUIPE   A "),normalizedTeamName("équipe a"));
});

test("édition exige tous les champs pour éviter les effacements implicites",()=>{
 assert.equal(parseTeamUpdate({teamId:"team",revision:0,name:"Koala"}),null);
 assert.equal(parseTeamUpdate({teamId:"team",revision:0,name:"Koala",agileMode:"scrum",productName:null,vision:null}),null);
 assert.deepEqual(parseTeamUpdate({teamId:"team",revision:3,name:"Koala",agileMode:"scrum",
  productName:"Produit",vision:"Vision",productGoal:"But"}),{
  teamId:"team",revision:3,name:"Koala",agileMode:"scrum",productName:"Produit",vision:"Vision",productGoal:"But"
 });
});
