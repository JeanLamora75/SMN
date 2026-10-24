import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseTeamContextChange,readTeamContext,saveTeamContext}
 from "../src/server/members/team-context";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const change={teamId:"team",revision:0,name:"  Team Renommée  ",
 vision:"  Livrer une valeur mesurable  ",productGoal:" Atteindre l'objectif "};
function fake(handler:(sql:string,args?:unknown[])=>{rows:unknown[];rowCount?:number}){
 const calls:{sql:string;args?:unknown[]}[]=[];
 const db={query:async(sql:string,args?:unknown[])=>{
  calls.push({sql,args});return handler(sql,args);
 }} as unknown as Client;
 return {db,calls};
}
test("validation stricte : texte libre, nom obligatoire, champs facultatifs et limites",()=>{
 const p=parseTeamContextChange(change);
 assert.deepEqual(p,{...change,name:"Team Renommée",vision:"Livrer une valeur mesurable",
  productGoal:"Atteindre l'objectif"});
 assert.equal(parseTeamContextChange({...change,vision:"",productGoal:null})?.vision,null);
 for(const invalid of [
  {...change,teamId:"other/team"},
  {...change,revision:-1},
  {...change,name:" "},
  {...change,name:"x".repeat(121)},
  {...change,vision:"x".repeat(5001)},
  {...change,productGoal:"\u0000"},
  {...change,unexpected:"value"}
 ])assert.equal(parseTeamContextChange(invalid),null);
});
test("lecture de l'équipe préexistante sans contexte : aucune mutation ni valeur inventée",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Ancienne équipe"}]}:
  sql.includes("to_regclass")?{rows:[{present:false}]}:{rows:[]});
 const result=await readTeamContext(f.db,"team");
 assert.deepEqual(result,{
  context:{teamId:"team",name:"Ancienne équipe",vision:null,productGoal:null,revision:0},
  history:[]
 });
 assert.ok(f.calls.every(c=>/^\s*SELECT/.test(c.sql)));
});
test("modification atomique du nom + vision + goal : un seul audit versionné",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Ancienne équipe"}]}:
  sql.includes("SELECT vision,product_goal,revision")?{rows:[]}:
  sql.startsWith("UPDATE public.smn_team")?{rows:[],rowCount:1}:
  {rows:[],rowCount:1});
 const result=await saveTeamContext(f.db,"admin-1",change);
 assert.equal(result.ok,true);
 if(result.ok){
  assert.equal(result.context.name,"Team Renommée");
  assert.equal(result.context.revision,1);
 }
 assert.equal(f.calls.filter(c=>c.sql==="BEGIN").length,1);
 assert.equal(f.calls.filter(c=>c.sql==="COMMIT").length,1);
 assert.equal(f.calls.filter(c=>c.sql.includes("INSERT INTO public.smn_team_context_audit")).length,1);
 assert.ok(f.calls.some(c=>c.sql.startsWith("UPDATE public.smn_team")));
 assert.ok(f.calls.some(c=>c.sql.startsWith("INSERT INTO public.smn_team_context ")));
 assert.equal(f.calls.some(c=>c.sql.includes("UPDATE public.smn_product")),false);
});
test("conflit de révision : aucune modification de l'équipe ou de l'historique",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Équipe en base"}]}:
  sql.includes("SELECT vision,product_goal,revision")?
  {rows:[{revision:2,vision:"V2",product_goal:"G2"}]}:{rows:[]});
 assert.deepEqual(await saveTeamContext(f.db,"admin-1",change),
  {ok:false,error:"conflict"});
 assert.equal(f.calls.some(c=>c.sql.startsWith("UPDATE public.smn_team")),false);
 assert.ok(f.calls.some(c=>c.sql==="ROLLBACK"));
});
test("enregistrement identique : aucun audit supplémentaire",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Team Renommée"}]}:
  sql.includes("SELECT vision,product_goal,revision")?
  {rows:[{revision:1,vision:"Livrer une valeur mesurable",
   product_goal:"Atteindre l'objectif"}]}:{rows:[]});
 const res=await saveTeamContext(f.db,"admin-1",{...change,revision:1});
 assert.equal(res.ok,true);
 if(res.ok)assert.equal(res.changed,false);
 assert.equal(f.calls.some(c=>c.sql.includes("INSERT INTO public.smn_team_context_audit")),false);
});
test("erreur SQL : rollback de la mutation du nom et de la vision",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("INSERT INTO public.smn_team_context_audit"))throw Error("db-failure");
  if(sql.includes("SELECT t.id,t.name"))return {rows:[{id:"team",name:"Ancienne"}]};
  if(sql.includes("SELECT vision,product_goal,revision"))return {rows:[]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 await assert.rejects(()=>saveTeamContext(db,"admin",change),/db-failure/);
 assert.ok(statements.includes("ROLLBACK"));
 assert.equal(statements.includes("COMMIT"),false);
});
test("lecture des révisions, le document courant reste séparé des versions antérieures",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Equipe v2"}]}:
  sql.includes("to_regclass")?{rows:[{present:true}]}:
  sql.includes("FROM public.smn_team_context_audit")?
  {rows:[{revision:2,after_values:{name:"Equipe v2",vision:"V2",productGoal:"G2"},
   changed_at:"2026-10-24",actor_id:"admin"}]}:
  {rows:[{vision:"V2",product_goal:"G2",revision:2}]});
 const response=await readTeamContext(f.db,"team");
 assert.equal(response?.context.name,"Equipe v2");
 assert.equal(response?.history[0]?.vision,"V2");
 assert.equal(response?.history[0]?.revision,2);
});
test("intégration : crayon près du nom, modal 3 champs, API sécurisée et i18n",()=>{
 const overview=read("src/app/app/admin/members/team-overview.tsx");
 const modal=read("src/app/app/admin/members/team-context-editor.tsx");
 const page=read("src/app/app/admin/members/page.tsx");
 const api=read("src/app/api/admin/team-context/route.ts");
 const reports=read("src/server/reports/team-context-read.ts");
 assert.match(overview,/TeamContextEditor teamId=\{roster\.team\.id\}/);
 assert.match(overview,/canManage&&roster/);
 assert.match(page,/canAccess\(actor,"write"/);
 assert.match(modal,/pencil-square/);
 assert.match(modal,/showModal\(\)/);
 assert.match(modal,/productGoal:goal\.trim\(\)\|\|null/);
 assert.match(api,/authorizeApi\(request,"write",settings\)/);
 assert.match(api,/authorizeApi\(request,"read",collective\)/);
 assert.match(reports,/smn_team_context/);
 for(const lang of ["fr","en"]){
  const json=JSON.parse(read("src/i18n/"+lang+".json"));
  for(const key of ["contextEdit","contextName","contextVision","contextProductGoal","contextSave"])
   assert.equal(typeof json.teamUX[key],"string",lang+" "+key);
 }
});
