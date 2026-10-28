import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {createInstallationTeam,updateInstallationTeam} from "../src/server/teams/write";

type Options={version?:number;role?:boolean;teams?:{id:string;name:string}[];
 current?:{id:string;name:string;product_id:string|null;product_name:string|null}|null;
 revision?:number;failInsert?:boolean};
function database(options:Options={}){
 const sqls:string[]=[],argumentsSeen:unknown[][]=[];
 const query=async(sql:string,params:unknown[]=[]):Promise<{rows:any[];rowCount:number}>=>{
  sqls.push(sql);argumentsSeen.push(params);
  if(sql.includes("FROM public.smn_installation"))return {rows:[{
   id:"singleton",schema_version:options.version??28,state:"initialized",mode:"scrum"
  }],rowCount:1};
  if(sql.includes("FROM public.smn_account"))return {rows:options.role===false?[]:[{id:"admin"}],rowCount:1};
  if(sql.includes("to_regclass("))return {rows:[{ready:true}],rowCount:1};
  if(sql.includes("SELECT id,name FROM public.smn_team"))return {rows:options.teams??[],rowCount:(options.teams??[]).length};
  if(sql.includes("FROM public.smn_team t LEFT JOIN"))return {
   rows:options.current===null?[]:[options.current??{
    id:"team",name:"Koala",product_id:"old-product",product_name:"Ancien"
   }],rowCount:1
  };
  if(sql.includes("SELECT revision,vision,product_goal"))return{
   rows:[{revision:options.revision??1,vision:null,product_goal:null}],rowCount:1
  };
  if(options.failInsert&&sql.startsWith("INSERT INTO public.smn_team("))throw Error("simulated-db-error");
  return {rows:[],rowCount:1};
 };
 return {db:{query} as unknown as Client,sqls,argumentsSeen};
}
test("création produit facultatif, une transaction et un audit",async()=>{
 const {db,sqls,argumentsSeen}=database();
 const r=await createInstallationTeam(db,"singleton","admin",{agileMode:"scrum",name:" Panda ",vision:" Vision "});
 assert.equal(r.ok,true);
 if(!r.ok)return;
 assert.equal(r.values.productName,null);
 assert.equal(r.revision,1);
 assert.equal(sqls[0],"BEGIN");
 assert.equal(sqls.at(-1),"COMMIT");
 assert.equal(sqls.some(s=>s.startsWith("INSERT INTO public.smn_product")),false);
 assert.equal(sqls.some(s=>s.startsWith("INSERT INTO public.smn_team_context_audit")),true);
 const index=sqls.findIndex(s=>s.startsWith("INSERT INTO public.smn_team("));
 assert.equal(argumentsSeen[index][2],null);
});
test("la version historique 27 interdit les écritures",async()=>{
 const {db,sqls}=database({version:27});
 const r=await createInstallationTeam(db,"singleton","admin",{agileMode:"scrum",name:"Panda"});
 assert.deepEqual(r,{ok:false,error:"schema-not-ready"});
 assert.equal(sqls.some(s=>s.startsWith("INSERT")),false);
});
test("un acteur non-admin ou un homonyme ne peut pas créer",async()=>{
 const denied=database({role:false});
 assert.deepEqual(await createInstallationTeam(denied.db,"singleton","admin",{agileMode:"scrum",name:"Panda"}),
  {ok:false,error:"forbidden"});
 const same=database({teams:[{id:"team",name:"  ÉQUIPE   Panda "}]});
 assert.deepEqual(await createInstallationTeam(same.db,"singleton","admin",{agileMode:"scrum",name:"équipe panda"}),
  {ok:false,error:"duplicate-name"});
 assert.equal(same.sqls.some(s=>s.startsWith("INSERT")),false);
});
test("édition : révision contradictoire sans modification",async()=>{
 const {db,sqls}=database({revision:3});
 const r=await updateInstallationTeam(db,"singleton","admin",
  {teamId:"team",revision:2,name:"Koala",productName:"Ancien",vision:null,productGoal:null});
 assert.deepEqual(r,{ok:false,error:"conflict"});
 assert.equal(sqls.some(s=>s.startsWith("UPDATE public.smn_team SET")),false);
});
test("édition : produit retiré sans suppression d'un produit historique",async()=>{
 const {db,sqls,argumentsSeen}=database();
 const r=await updateInstallationTeam(db,"singleton","admin",
  {teamId:"team",revision:1,name:"Koala",productName:null,vision:"Nouvelle vision",productGoal:null});
 assert.equal(r.ok,true);
 assert.equal(sqls.some(s=>s.startsWith("DELETE FROM public.smn_product")),false);
 const i=sqls.findIndex(s=>s.startsWith("UPDATE public.smn_team SET"));
 assert.equal(argumentsSeen[i][3],null);
 assert.equal(sqls.some(s=>s.startsWith("INSERT INTO public.smn_team_context_audit")),true);
});
test("transaction annulée si PostgreSQL échoue",async()=>{
 const {db,sqls}=database({failInsert:true});
 await assert.rejects(()=>createInstallationTeam(db,"singleton","admin",{agileMode:"scrum",name:"Panda"}));
 assert.equal(sqls.at(-1),"ROLLBACK");
});

test("édition refuse un produit référencé hors installation",async()=>{
 const {db,sqls}=database({current:{
  id:"team",name:"Koala",product_id:"foreign-product",product_name:null
 }});
 await assert.rejects(()=>updateInstallationTeam(db,"singleton","admin",{
  teamId:"team",revision:1,name:"Koala",productName:"Produit",vision:null,productGoal:null
 }),/team-product-outside-installation/);
 assert.equal(sqls.at(-1),"ROLLBACK");
});
test("création d'un produit réel propre à la nouvelle équipe",async()=>{
 const {db,sqls,argumentsSeen}=database();
 const r=await createInstallationTeam(db,"singleton","admin",{
  agileMode:"kanban",name:"Tigre",productName:"Portail client",vision:"Vision",productGoal:"But"
 });
 assert.equal(r.ok,true);
 const pi=sqls.findIndex(s=>s.startsWith("INSERT INTO public.smn_product("));
 const ti=sqls.findIndex(s=>s.startsWith("INSERT INTO public.smn_team("));
 assert.ok(pi>=0&&ti>pi);
 assert.equal(argumentsSeen[pi][2],"Portail client");
 assert.equal(argumentsSeen[ti][2],argumentsSeen[pi][0]);
});
