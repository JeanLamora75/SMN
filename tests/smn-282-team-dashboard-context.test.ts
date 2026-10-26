import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {resolveAdminTeam} from "../src/server/teams/resolve";
import {readAccountDashboard} from "../src/server/dashboard/read";
import {projectCollectiveContext} from "../src/lib/collective-projection";

type Opt={role?:boolean;version?:number;preference?:string|null;
 requested?:string;teamExists?:boolean;product?:string|null};
function client(o:Opt={}){
 const statements:Array<{sql:string;values:unknown[]}>= [];
 const query=async(sql:string,values:unknown[]=[])=>{
  statements.push({sql,values});
  if(sql.includes("SELECT i.schema_version FROM public.smn_installation i"))
   return {rows:[{schema_version:o.version??28}]};
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:o.role===false?[]:[{installation_id:"singleton",schema_version:o.version??28}]};
  if(sql.includes("SELECT t.id AS team_id FROM public.smn_account_team_preference"))
   return {rows:[{team_id:o.preference??"team_a"}]};
  if(sql.includes("SELECT p.id AS product_id")&&sql.includes("WHERE t.id=$1"))
   return {rows:o.teamExists===false?[]:[{
    product_id:o.product??null,product:o.product??null,
    team_id:values[0],team:"Panda",mode:"scrum"
   }]};
  if(sql.includes("SELECT p.id AS product_id")||sql.includes("FROM public.smn_installation i"))
   return {rows:[{product_id:"original",product:"Produit",team_id:"team_a",team:"Koala",mode:"scrum"}]};
  throw Error("Unexpected SQL "+sql);
 };
 return {db:{query} as unknown as Client,statements};
}
test("v28 : URL explicite prime sur préférence et filtre installation",async()=>{
 const m=client({preference:"team_a"});
 const result=await resolveAdminTeam(m.db,{accountId:"admin",role:"admin"},"team_b");
 assert.equal(result.team_id,"team_b");
 const q=m.statements.find(x=>x.sql.includes("SELECT p.id AS product_id"));
 assert.deepEqual(q?.values,["team_b","singleton"]);
});
test("v28 : compte user, équipe absente ou identifiant forgé refusés",async()=>{
 const forbidden=client();
 await assert.rejects(()=>resolveAdminTeam(forbidden.db,
  {accountId:"user",role:"user"},"team_b"),/team-access-forbidden/);
 const bad=client();
 await assert.rejects(()=>resolveAdminTeam(bad.db,
  {accountId:"admin",role:"admin"},"../foreign"),/team-id-invalid/);
 const missing=client({teamExists:false});
 await assert.rejects(()=>resolveAdminTeam(missing.db,
  {accountId:"admin",role:"admin"},"team_other"),/team-context-unavailable/);
});
test("v28 : préférence utilisée en l'absence de teamId d'URL",async()=>{
 const m=client({preference:"team_a"});
 const result=await resolveAdminTeam(m.db,{accountId:"admin",role:"admin"});
 assert.equal(result.team_id,"team_a");
});
test("v28 : tableau de bord produit nullable, sans synthèse fictive",async()=>{
 const m=client();
 const dashboard=await readAccountDashboard(m.db,{accountId:"admin",role:"admin"},"team_b");
 assert.deepEqual(dashboard.context,{
  productId:null,product:null,teamId:"team_b",team:"Panda",mode:"scrum"
 });
});
test("v27 : ancien chemin monoéquipe préservé",async()=>{
 const m=client({version:27});
 const dashboard=await readAccountDashboard(m.db,{accountId:"user",role:"user"});
 assert.equal(dashboard.context.teamId,"team_a");
 assert.ok(m.statements.some(x=>x.sql.includes("JOIN public.smn_product p")));
});
test("projection rejette un produit partiel ou un identifiant inventé",()=>{
 assert.equal(projectCollectiveContext({productId:"p",product:null,
  teamId:"t",team:"Alpha",mode:"scrum"}),null);
 assert.equal(projectCollectiveContext({productId:null,product:null,
  teamId:"../t",team:"Alpha",mode:"scrum"}),null);
});
