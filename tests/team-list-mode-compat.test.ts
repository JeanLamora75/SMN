import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {listInstallationTeams} from "../src/server/teams/list";
import type {Client} from "pg";
test("liste des équipes: utilise le mode de l'installation si colonne agile_mode absente",async()=>{
 const queries:string[]=[];
 const db={query:async(sql:string)=>{
  queries.push(sql);
  if(sql.includes("to_regclass"))return {rows:[{exists:true}]};
  return {rows:[{id:"t1",name:"Koala",agile_mode:"scrum",product_name:null,vision:null,product_goal:null,revision:1}]};
 }} as unknown as Client;
 const teams=await listInstallationTeams(db,"singleton");
 assert.equal(teams.length,1);
 assert.equal(teams[0].agileMode,"scrum");
 const sql=queries[1];
 assert.match(sql,/to_jsonb\(t\)->>'agile_mode'/);
 assert.match(sql,/JOIN public\.smn_installation i/);
 assert.doesNotMatch(sql,/SELECT t\.id,t\.name,t\.agile_mode/);
});
test("les deux branches SQL de listing acceptent le schéma sans agile_mode",()=>{
 const src=readFileSync(new URL("../src/server/teams/list.ts",import.meta.url),"utf8");
 assert.equal(src.split("COALESCE(NULLIF(to_jsonb(t)->>'agile_mode'").length-1,2);
});
