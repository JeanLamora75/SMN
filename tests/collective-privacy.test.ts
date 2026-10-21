import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {projectCollectiveContext,projectCollectiveBrief} from "../src/lib/collective-projection";
import {readCollectiveDashboard} from "../src/server/dashboard/read";
import {readTeamDetail} from "../src/server/dashboard/team-detail";

const context={productId:"product",product:"Pilot",teamId:"team",team:"Equipe",mode:"scrum" as const};
describe("SMN-26 collective allowlist",()=>{
 it("strips unexpected properties from view and brief",()=>{
  const extra={...context,personalEmail:"person@test.invalid",individualRate:4,hiddenRecord:{secret:true}};
  assert.deepEqual(projectCollectiveContext(extra),context);
  assert.deepEqual(projectCollectiveBrief(extra),{context});
  assert.equal(JSON.stringify(projectCollectiveBrief(extra)).includes("person@test.invalid"),false);
 });
 it("rejects incomplete and invalid context",()=>{
  for(const x of [null,[],{}, {...context,mode:"other"},{...context,teamId:"../outside"}])
   assert.equal(projectCollectiveContext(x),null);
 });
 it("dashboard and team detail never forward unexpected SQL columns",async()=>{
  const db={query:async()=>({rows:[{product_id:"product",product:"Pilot",team_id:"team",
   team:"Equipe",mode:"scrum",personalEmail:"redacted"}]})} as unknown as Client;
  const dashboard=await readCollectiveDashboard(db);
  assert.deepEqual(dashboard.context,context);
  assert.equal(JSON.stringify(dashboard).includes("redacted"),false);
  assert.deepEqual(await readTeamDetail(db,"team"),context);
 });
});
