import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {listInstallationTeams} from "../src/server/teams/list";

test("v29: team fields stay available without the optional context table",async()=>{
 const sql:string[]=[];
 const db={query:async(query:string)=>{
  sql.push(query);
  if(query.includes("to_regclass"))return {rows:[{exists:false}]};
  if(query.includes("schema_version"))return {rows:[{schema_version:29}]};
  return {rows:[{id:"team_a",name:"Alpha",product_name:null,vision:null,
   product_goal:null,revision:0,agile_mode:"kanban",mode_locked:false,is_archived:false}]};
 }} as unknown as Client;
 const teams=await listInstallationTeams(db,"singleton");
 assert.equal(teams[0].agileMode,"kanban");
 assert.ok(sql.at(-1)?.includes("t.agile_mode,t.mode_locked,t.is_archived"));
});
