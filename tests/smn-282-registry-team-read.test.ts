import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {resolveRegistryReadContext} from "../src/server/registries/team-access";
import {readRegistryPage,readRegistryCycles,parseRegistryFilters}
 from "../src/server/registries/list";
import {readTeamRegistryItem} from "../src/server/registries/team-item-read";
import {registryIndexUrl,parseRegistryIndexState,registryDetailHref}
 from "../src/lib/registry-navigation";

const admin={accountId:"admin",role:"admin"} as const;
const id="123e4567-e89b-42d3-a456-426614174000";
function fake(options:{version?:number;foreign?:boolean}={}){
 const queries:Array<{sql:string;args:unknown[]}>= [];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push({sql,args});
  if(sql.includes("SELECT schema_version FROM public.smn_installation"))
   return {rows:[{schema_version:options.version??28}]};
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:28}]};
  if(sql.includes("FROM public.smn_account_team_preference p"))
   return {rows:[{team_id:"team_b"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:"team_a",
    team:"Alpha",mode:"scrum"}]};
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  if(sql.includes("COUNT(*)::int AS total"))return {rows:[{total:1}]};
  if(sql.includes("FROM public.smn_registry_item r WHERE"))
   return {rows:[{id,title:"Alpha incident",type:"risk",status:"open"}]};
  if(sql.includes("SELECT r.id,r.team_id AS"))return {rows:options.foreign?[]:[{
   id,teamId:"team_a",type:"risk",title:"Alpha incident",status:"open",
   occurredOn:"2026-10-27",description:"Scoped",dueOn:null,owner:null,
   comment:null,revision:1
  }]};
  if(sql.includes("SELECT s.id,s.name,s.status FROM public.smn_sprint"))
   return {rows:[{id:"cycle_a",name:"Sprint A",status:"active"}]};
  throw Error("Unexpected SQL "+sql.slice(0,110));
 }} as unknown as Client;
 return {db,queries};
}
test("V28 : la préférence d'une autre équipe ne remplace jamais le teamId autorisé",async()=>{
 const f=fake();
 const ctx=await resolveRegistryReadContext(f.db,admin,"team_a");
 assert.equal(ctx.version,28);
 assert.equal(ctx.team?.team_id,"team_a");
 const lookup=f.queries.find(q=>q.sql.includes("SELECT p.id AS product_id"));
 assert.deepEqual(lookup?.args,["team_a","singleton"]);
});
test("Liste du registre v28 : chaque requête conserve team_id=$1",async()=>{
 const f=fake();
 const ctx=await resolveRegistryReadContext(f.db,admin,"team_a");
 const filters=parseRegistryFilters(new URLSearchParams());
 assert.ok(filters);
 const list=await readRegistryPage(f.db,filters!,true,ctx.team);
 assert.equal(list.state,"available");
 assert.ok("team" in list&&list.team?.id==="team_a");
 const count=f.queries.find(q=>q.sql.includes("COUNT(*)::int AS total"));
 assert.equal(count?.args[0],"team_a");
 assert.match(count!.sql,/r.team_id=\$1/);
 const rows=f.queries.find(q=>q.sql.includes("FROM public.smn_registry_item r WHERE"));
 assert.equal(rows?.args[0],"team_a");
 assert.match(rows!.sql,/r.team_id=\$1/);
});
test("Cycles de la liste : équipe sélectionnée explicitement",async()=>{
 const f=fake();
 const ctx=await resolveRegistryReadContext(f.db,admin,"team_a");
 const result=await readRegistryCycles(f.db,ctx.team);
 assert.equal(result.state,"available");
 assert.ok("cycles" in result&&result.cycles[0].id==="cycle_a");
 const lookup=f.queries.find(q=>q.sql.includes("FROM public.smn_sprint"));
 assert.deepEqual(lookup?.args,["team_a"]);
});
test("Détail v28 : identifiant étranger renvoie null sans contenu",async()=>{
 const f=fake({foreign:true});
 const result=await readTeamRegistryItem(f.db,admin,"team_a",id);
 assert.equal(result,null);
 const check=f.queries.find(q=>q.sql.includes("SELECT r.id,r.team_id AS"));
 assert.deepEqual(check?.args,[id,"team_a"]);
 assert.match(check!.sql,/r.id=\$1 AND r.team_id=\$2/);
});
test("Compte user et ID forgé : refus avant consultation des données de registre",async()=>{
 const user=fake();
 await assert.rejects(()=>readTeamRegistryItem(user.db,
  {accountId:"user",role:"user"},"team_a",id),/team-access-forbidden/);
 assert.equal(user.queries.length,0);
 const invalid=fake();
 await assert.rejects(()=>readTeamRegistryItem(invalid.db,
  admin,"team_a","../foreign"),/registry-item-id-invalid/);
 assert.equal(invalid.queries.length,0);
});
test("Navigation et retour conservent l'équipe dans les liens sans URL extérieure",()=>{
 const state=parseRegistryIndexState("/app/admin/registries?teamId=team_a&view=cards");
 assert.equal(state.teamId,"team_a");
 const origin=registryIndexUrl(state);
 assert.match(origin,/teamId=team_a/);
 const detail=registryDetailHref(id,{origin,trail:[]});
 assert.ok(detail.includes(encodeURIComponent(origin)));
 assert.equal(parseRegistryIndexState("/app/admin/registries?teamId=../foreign").teamId,undefined);
});
test("v27 : routeur du registre conserve son ancien chemin monoéquipe",async()=>{
 const f=fake({version:27});
 const result=await resolveRegistryReadContext(f.db,admin,null);
 assert.deepEqual(result,{version:27});
 const reads=f.queries.filter(q=>q.sql.includes("SELECT p.id AS product_id"));
 assert.equal(reads.length,0);
});
