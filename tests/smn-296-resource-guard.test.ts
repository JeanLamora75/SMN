import assert from "node:assert/strict";
import test from "node:test";
import type {Client} from "pg";
import {assertActiveTeamResource} from "../src/server/teams/resource-guard";

function database(matches:boolean){
 const statements:string[]=[];
 const query=async(sql:string,params:unknown[]=[])=>{
  statements.push(sql);
  if(sql.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:29}]};
  if(sql.includes("FROM public.smn_account_team_preference"))return {rows:[{team_id:"team_a"}]};
  if(sql.includes("LEFT JOIN public.smn_product"))return {rows:[{team_id:"team_a",team:"Team A",mode:"scrum",product_id:null,product:null}]};
  if(sql.includes("SELECT id FROM public.smn_sprint")){assert.deepEqual(params,["cycle_1","team_a"]);return {rows:matches?[{id:"cycle_1"}]:[]};}
  throw Error("Unexpected query "+sql);
 };
 return {db:{query} as unknown as Client,statements};
}
test("resource guard requires matching team ownership",async()=>{
 const {db}=database(true);
 await assert.doesNotReject(()=>assertActiveTeamResource(db,{accountId:"admin",role:"admin"},"team_a","sprint","cycle_1"));
});
test("cross-team cycle identifier is denied",async()=>{
 const {db}=database(false);
 await assert.rejects(()=>assertActiveTeamResource(db,{accountId:"admin",role:"admin"},"team_a","sprint","cycle_1"),/team-resource-unavailable/);
});
test("invalid resource identifiers fail before database access",async()=>{
 const {db,statements}=database(false);
 await assert.rejects(()=>assertActiveTeamResource(db,{accountId:"admin",role:"admin"},"team_a","sprint","../bad"),/team-resource-invalid/);
 assert.equal(statements.length,0);
});
