import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {resolveAdminTeam} from "../src/server/teams/resolve";
import {readTeamRegistryItem} from "../src/server/registries/team-item-read";

const recordA="11111111-1111-4111-8111-111111111111";
const recordB="22222222-2222-4222-8222-222222222222";
const admin={accountId:"admin_1",role:"admin"} as const;
type Call={sql:string;params:unknown[]};
function mockDb(options:{archived?:boolean}={}){
 const calls:Call[]=[];
 const query=async(sql:string,params:unknown[]=[]):Promise<{rows:unknown[]}>=>{
  calls.push({sql,params});
  if(sql.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:30}]};
  if(sql.includes("FROM public.smn_account_team_preference"))return {rows:[]};
  if(sql.includes("FROM information_schema.columns"))return {rows:[{name:"agile_mode"},{name:"is_archived"}]};
  if(sql.includes("FROM public.smn_team t")&&sql.includes("LEFT JOIN public.smn_product")){
   const id=params[0];
   return {rows:id==="team_a"&&!options.archived?
    [{product_id:null,product:null,team_id:"team_a",team:"Team A",mode:"scrum"}]:[]};
  }
  if(sql.includes("FROM public.smn_registry_item r")){
   assert.match(sql,/r\.team_id=\$2/,"la lecture doit filtrer le teamId dans SQL");
   const [recordId,teamId]=params;
   return {rows:recordId===recordA&&teamId==="team_a"?
    [{id:recordA,teamId:"team_a",type:"risk",title:"Risque A",status:"open",
      occurredOn:"2026-10-28",description:null,dueOn:null,owner:null,comment:null,revision:1}]:[]};
  }
  throw Error("SQL non pris en charge dans ce faux client: "+sql);
 };
 return {db:{query} as unknown as Client,calls};
}

test("v30: l'admin Team A peut lire sa propre fiche",async()=>{
 const {db,calls}=mockDb();
 const item=await readTeamRegistryItem(db,admin,"team_a",recordA);
 assert.equal(item?.id,recordA);
 assert.ok(calls.some(c=>c.params[0]===recordA&&c.params[1]==="team_a"));
});
test("v30: l'identifiant d'une fiche Team B n'est pas lisible depuis Team A",async()=>{
 const {db}=mockDb();
 assert.equal(await readTeamRegistryItem(db,admin,"team_a",recordB),null);
});
test("v30: une équipe non accessible ne peut pas être résolue",async()=>{
 const {db}=mockDb();
 await assert.rejects(resolveAdminTeam(db,admin,"team_b"),/team-context-unavailable/);
});
test("v30: un compte user ne peut pas choisir un teamId admin",async()=>{
 const {db,calls}=mockDb();
 await assert.rejects(resolveAdminTeam(db,{accountId:"user_1",role:"user"},"team_a"),/team-access-forbidden/);
 assert.equal(calls.length,0);
});
test("v30: une équipe archivée est refusée",async()=>{
 const {db}=mockDb({archived:true});
 await assert.rejects(resolveAdminTeam(db,admin,"team_a"),/team-context-unavailable/);
});
