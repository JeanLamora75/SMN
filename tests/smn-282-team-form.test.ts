import {test} from "node:test";
import assert from "node:assert/strict";
import {parseTeamCreate} from "../src/lib/team-form";
test("nom d'équipe obligatoire",()=>{assert.equal(parseTeamCreate({name:" "}),null);});

test("création avec champs facultatifs",()=>{
 assert.deepEqual(parseTeamCreate({name:" Koala ",productName:" ",vision:" Objectif ",productGoal:null}),{
  name:"Koala",productName:null,vision:"Objectif",productGoal:null
 });
});
test("validation des formats",()=>{
 assert.equal(parseTeamCreate({name:"x".repeat(121)}),null);
 assert.equal(parseTeamCreate({name:"Koala",vision:"x".repeat(5001)}),null);
 assert.equal(parseTeamCreate({name:"Koala",installationId:"singleton"}),null);
});
