import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {resolveAdminTeam} from "../src/server/teams/resolve";

function client(ids:string[],requestedArchive:string[]=[]):Client{
 return {query:async(sql:string,args?:unknown[])=>{
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"installation_one",schema_version:30}]};
  if(sql.includes("FROM public.smn_account_team_preference"))return {rows:[]};
  if(sql.includes("SELECT id FROM public.smn_team WHERE installation_id"))
   return {rows:ids.filter(x=>!requestedArchive.includes(x)).slice(0,2).map(id=>({id}))};
  if(sql.includes("information_schema.columns"))
   return {rows:[{name:"agile_mode"},{name:"is_archived"}]};
  if(sql.includes("SELECT p.id AS product_id")){
   const id=String(args?.[0]);
   return {rows:ids.includes(id)&&!requestedArchive.includes(id)?[
    {team_id:id,team:id,product_id:null,product:null,mode:"scrum"}]:[]};
  }
  throw Error("Unexpected SQL");
 }} as unknown as Client;
}
const actor={accountId:"admin_one",role:"admin" as const};
test("sélection explicite d'une équipe autorisée",async()=>{
 const row=await resolveAdminTeam(client(["team_a"]),actor,"team_a");
 assert.equal(row.team_id,"team_a");
});
test("équipe inexistante ou extérieure rejetée",async()=>{
 await assert.rejects(resolveAdminTeam(client(["team_a"]),actor,"team_b"));
});
test("équipe archivée rejetée",async()=>{
 await assert.rejects(resolveAdminTeam(client(["team_a"],["team_a"]),actor,"team_a"));
});
test("plusieurs équipes sans préférence : aucun choix implicite",async()=>{
 await assert.rejects(resolveAdminTeam(client(["team_a","team_b"]),actor));
});
test("équipe unique : résolution automatique",async()=>{
 assert.equal((await resolveAdminTeam(client(["team_a"]),actor)).team_id,"team_a");
});
test("un rôle utilisateur est rejeté",async()=>{
 await assert.rejects(resolveAdminTeam(client(["team_a"]),{accountId:"user_a",role:"user"}));
});
