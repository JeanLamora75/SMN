import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseTeamContextChange,readTeamContext,saveTeamContext}
 from "../src/server/members/team-context";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const change={teamId:"team",revision:0,name:"  Team Renommée  ",productName:" My Product ",
 vision:"  Livrer une valeur mesurable  ",productGoal:" Atteindre l'objectif "};
function fake(handler:(sql:string,args?:unknown[])=>{rows:unknown[];rowCount?:number}){
 const calls:{sql:string;args?:unknown[]}[]=[];
 const db={query:async(sql:string,args?:unknown[])=>{
  calls.push({sql,args});
  if(sql.includes("relname AS name FROM pg_class"))return {rows:[{name:"smn_team_context"},{name:"smn_team_context_audit"}]};
  return handler(sql,args);
 }} as unknown as Client;
 return {db,calls};
}
test("validation stricte : texte libre, nom obligatoire, champs facultatifs et limites",()=>{
 const p=parseTeamContextChange(change);
 assert.deepEqual(p,{...change,name:"Team Renommée",productName:"My Product",vision:"Livrer une valeur mesurable",
  productGoal:"Atteindre l'objectif"});
 assert.equal(parseTeamContextChange({...change,vision:"",productGoal:null})?.vision,null);
 for(const invalid of [
  {...change,teamId:"other/team"},
  {...change,revision:-1},
  {...change,name:" "},
  {...change,productName:" "},
  {...change,productName:"x".repeat(121)},
  {...change,name:"x".repeat(121)},
  {...change,vision:"x".repeat(5001)},
  {...change,productGoal:"\u0000"},
  {...change,unexpected:"value"}
 ])assert.equal(parseTeamContextChange(invalid),null);
});
test("lecture de l'équipe préexistante sans contexte : aucune mutation ni valeur inventée",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Ancienne équipe",product_id:"product",product_name:"My Product"}]}:
  sql.includes("to_regclass")?{rows:[{present:false}]}:{rows:[]});
 const result=await readTeamContext(f.db,"team");
 assert.deepEqual(result,{
  context:{teamId:"team",name:"Ancienne équipe",productName:"My Product",vision:null,productGoal:null,revision:0},
  history:[]
 });
 assert.ok(f.calls.every(c=>/^\s*SELECT/.test(c.sql)));
});
test("modification atomique du nom + vision + goal : un seul audit versionné",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Ancienne équipe",product_id:"product",product_name:"My Product"}]}:
  sql.includes("SELECT vision,product_goal,revision")?{rows:[]}:
  sql.startsWith("UPDATE public.smn_team")?{rows:[],rowCount:1}:
  {rows:[],rowCount:1});
 const result=await saveTeamContext(f.db,"admin-1",change);
 assert.equal(result.ok,true);
 if(result.ok){
  assert.equal(result.context.name,"Team Renommée");
  assert.equal(result.context.productName,"My Product");
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
  {rows:[{id:"team",name:"Équipe en base",product_id:"product",product_name:"My Product"}]}:
  sql.includes("SELECT vision,product_goal,revision")?
  {rows:[{revision:2,vision:"V2",product_goal:"G2"}]}:{rows:[]});
 assert.deepEqual(await saveTeamContext(f.db,"admin-1",change),
  {ok:false,error:"conflict"});
 assert.equal(f.calls.some(c=>c.sql.startsWith("UPDATE public.smn_team")),false);
 assert.ok(f.calls.some(c=>c.sql==="ROLLBACK"));
});
test("enregistrement identique : aucun audit supplémentaire",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Team Renommée",product_id:"product",product_name:"My Product"}]}:
  sql.includes("SELECT vision,product_goal,revision")?
  {rows:[{revision:1,vision:"Livrer une valeur mesurable",
   product_goal:"Atteindre l'objectif"}]}:{rows:[]});
 const res=await saveTeamContext(f.db,"admin-1",{...change,revision:1});
 assert.equal(res.ok,true);
 if(res.ok)assert.equal(res.changed,false);
 assert.equal(f.calls.some(c=>c.sql.includes("INSERT INTO public.smn_team_context_audit")),false);
});
test("renommage du produit : seul son libellé change, sans remplacer le produit ni l'équipe",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Team Renommée",product_id:"product",product_name:"My Product"}]}:
  sql.includes("SELECT vision,product_goal,revision")?
  {rows:[{revision:1,vision:"Livrer une valeur mesurable",
   product_goal:"Atteindre l'objectif"}]}:
  {rows:[],rowCount:1});
 const result=await saveTeamContext(f.db,"admin-1",{
  teamId:"team",revision:1,name:"Team Renommée",productName:"New Product",
  vision:"Livrer une valeur mesurable",productGoal:"Atteindre l'objectif"
 });
 assert.equal(result.ok,true);
 if(result.ok)assert.equal(result.context.productName,"New Product");
 const update=f.calls.find(c=>c.sql.startsWith("UPDATE public.smn_product SET name"));
 assert.deepEqual(update?.args,["product","New Product"]);
 assert.equal(f.calls.some(c=>c.sql.startsWith("UPDATE public.smn_team SET")),false);
 assert.ok(f.calls.some(c=>c.sql.includes("INSERT INTO public.smn_team_context_audit")));
 assert.equal(f.calls.some(c=>/UPDATE public.smn_product SET id/.test(c.sql)),false);
});
test("renommage du produit et audit : rollback complet si une écriture échoue",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("INSERT INTO public.smn_team_context_audit"))throw Error("audit-failed");
  if(sql.includes("SELECT t.id,t.name"))return {rows:[{
   id:"team",name:"Team Renommée",product_id:"product",product_name:"My Product"}]};
  if(sql.includes("SELECT vision,product_goal,revision"))return {rows:[{
   revision:1,vision:"Livrer une valeur mesurable",product_goal:"Atteindre l'objectif"}]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 await assert.rejects(()=>saveTeamContext(db,"admin-1",{
  teamId:"team",revision:1,name:"Team Renommée",productName:"New Product",
  vision:"Livrer une valeur mesurable",productGoal:"Atteindre l'objectif"
 }),/audit-failed/);
 assert.ok(statements.some(sql=>sql.startsWith("UPDATE public.smn_product SET name")));
 assert.ok(statements.includes("ROLLBACK"));
 assert.equal(statements.includes("COMMIT"),false);
});
test("erreur SQL : rollback de la mutation du nom et de la vision",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("INSERT INTO public.smn_team_context_audit"))throw Error("db-failure");
  if(sql.includes("SELECT t.id,t.name"))return {rows:[{id:"team",name:"Ancienne",product_id:"product",product_name:"My Product"}]};
  if(sql.includes("SELECT vision,product_goal,revision"))return {rows:[]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 await assert.rejects(()=>saveTeamContext(db,"admin",change),/db-failure/);
 assert.ok(statements.includes("ROLLBACK"));
 assert.equal(statements.includes("COMMIT"),false);
});
test("lecture des révisions, le document courant reste séparé des versions antérieures",async()=>{
 const f=fake(sql=>sql.includes("SELECT t.id,t.name")?
  {rows:[{id:"team",name:"Equipe v2",product_id:"product",product_name:"My Product"}]}:
  sql.includes("to_regclass")?{rows:[{present:true}]}:
  sql.includes("FROM public.smn_team_context_audit")?
  {rows:[{revision:2,after_values:{name:"Equipe v2",vision:"V2",productGoal:"G2"},
   changed_at:"2026-10-24",actor_id:"admin"}]}:
  {rows:[{vision:"V2",product_goal:"G2",revision:2}]});
 const response=await readTeamContext(f.db,"team");
 assert.equal(response?.context.name,"Equipe v2");
 assert.equal(response?.history[0]?.vision,"V2");
 assert.equal(response?.history[0]?.revision,2);
 assert.equal(response?.history[0]?.productName,null);
});
test("intégration : crayon, modal 4 champs, API sécurisée, largeur adaptative et i18n",()=>{
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
 assert.match(modal,/productName/);
 assert.match(modal,/smn-team-context-dialog/);
 assert.doesNotMatch(modal,/width:"min\(90vw,680px\)"/);
 const css=read("src/app/globals.css");
 assert.match(css,/dialog\.smn-team-context-dialog/);
 assert.match(css,/\.smn-team-context-dialog \.modal-content \{/);
 assert.match(css,/max-width:100%/);
 assert.match(api,/readJsonObject\(request,48000\)/);
 assert.match(api,/authorizeApi\(request,"write",settings\)/);
 assert.match(api,/authorizeApi\(request,"read",collective\)/);
 assert.match(reports,/smn_team_context/);
 for(const lang of ["fr","en"]){
  const json=JSON.parse(read("src/i18n/"+lang+".json"));
  for(const key of ["contextEdit","contextName","contextProductName","contextVision","contextProductGoal","contextSave"])
   assert.equal(typeof json.teamUX[key],"string",lang+" "+key);
 }
});

test("la page Équipe affiche Vision et But côte à côte dans le nouveau bandeau",()=>{
 const overview=read("src/app/app/admin/members/team-overview.tsx");
 const modal=read("src/app/app/admin/members/team-context-editor.tsx");
 assert.match(overview,/className="smn-team-hero"/);
 assert.match(overview,/className="smn-team-hero-context"/);
 assert.equal((overview.match(/className="smn-team-hero-info"/g)??[]).length,2);
 assert.match(overview,/t\("teamCockpit\.title"\)/);
 assert.match(overview,/t\("teamUX\.contextVision"\)/);
 assert.match(overview,/t\("teamUX\.contextGoalHeading"\)/);
 assert.match(overview,/currentContext\?\.vision/);
 assert.match(overview,/currentContext\?\.productGoal/);
 assert.match(overview,/BootstrapIcon name="bullseye"/);
 assert.match(overview,/BootstrapIcon name="stack"/);
 assert.match(overview,/onSaved=\{updated=>/);
 assert.match(modal,/onSaved\(result\.context\)/);
 assert.doesNotMatch(overview,/smn-team-context-preview/);
});
test("la synthèse utilise l'API contextuelle, respecte les vides et les états non fiables",()=>{
 const overview=read("src/app/app/admin/members/team-overview.tsx");
 const api=read("src/app/api/admin/team-context/route.ts");
 const server=read("src/server/members/team-context.ts");
 assert.match(overview,/fetch\("\/api\/admin\/team-context\?"/);
 assert.match(overview,/signal:controller\.signal/);
 assert.match(overview,/result\.context\?\.teamId!==teamId/);
 assert.match(overview,/previous\.value\.revision>result\.context\.revision/);
 assert.match(overview,/contextPreviewEmpty/);
 assert.match(overview,/contextPreviewUnavailable/);
 assert.match(overview,/contextPreviewLoading/);
 assert.match(api,/authorizeApi\(request,"read",collective\)/);
 assert.match(server,/productName:scope\.rows\[0\]\.product_name/);
});
test("le bandeau Équipe reste responsive et les contenus ne sont pas tronqués",()=>{
 const css=read("src/app/app/admin/members/team-cockpit.css");
 const overview=read("src/app/app/admin/members/team-overview.tsx");
 assert.match(css,/\.smn-team-cockpit \.smn-team-hero/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/grid-template-areas:"identity actions" "context context"/);
 assert.match(css,/@media \(max-width:650px\)/);
 assert.match(css,/grid-template-areas:"identity" "context" "actions"/);
 assert.match(css,/white-space:pre-wrap/);
 assert.doesNotMatch(css,/-webkit-line-clamp/);
 assert.match(overview,/smn-team-hero-icon/);
 for(const lang of ["fr","en"]){
  const json=JSON.parse(read("src/i18n/"+lang+".json"));
  for(const k of ["contextGoalHeading","contextOverview",
   "contextPreviewLoading","contextPreviewUnavailable","contextPreviewEmpty"]){
   assert.equal(typeof json.teamUX[k],"string",lang+" "+k);
  }
 }
});
