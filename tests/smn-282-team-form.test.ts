import {test} from "node:test";
import assert from "node:assert/strict";
import {parseTeamCreate,parseTeamUpdate,normalizedTeamName} from "../src/lib/team-form";
test("nom d'équipe obligatoire",()=>{assert.equal(parseTeamCreate({agileMode:"scrum",name:" "}),null);});

test("création avec champs facultatifs",()=>{
 assert.deepEqual(parseTeamCreate({agileMode:"scrum",name:" Koala ",productName:" ",vision:" Objectif ",productGoal:null}),{
  name:"Koala",productName:null,vision:"Objectif",productGoal:null,agileMode:"scrum"
 });
});
test("validation des formats",()=>{
 assert.equal(parseTeamCreate({agileMode:"scrum",name:"x".repeat(121)}),null);
 assert.equal(parseTeamCreate({agileMode:"scrum",name:"Koala",vision:"x".repeat(5001)}),null);
 assert.equal(parseTeamCreate({agileMode:"scrum",name:"Koala",installationId:"singleton"}),null);
});

test("mise à jour exige une révision et un identifiant valides",()=>{
 assert.deepEqual(parseTeamUpdate({teamId:"team_1",revision:0,name:"Panda",productName:null,vision:null,productGoal:null}),{
  teamId:"team_1",revision:0,name:"Panda",productName:null,vision:null,productGoal:null
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
 assert.equal(parseTeamUpdate({teamId:"team",revision:0,name:"Koala",productName:null,vision:null}),null);
 assert.deepEqual(parseTeamUpdate({teamId:"team",revision:3,name:"Koala",
  productName:"Produit",vision:"Vision",productGoal:"But"}),{
  teamId:"team",revision:3,name:"Koala",productName:"Produit",vision:"Vision",productGoal:"But"
 });
});
