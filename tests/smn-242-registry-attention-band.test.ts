import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseRegistryAttentionPayload} from "../src/lib/registry-attention-view";
import {readAttention} from "../src/server/registries/attention";

const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const alert=(id:string,reason="obstacle")=>({
 id,type:"obstacle",title:"Obstacle "+id,status:"open",reason,dueOn:null
});
function dbWithItems(rows:unknown[],available=true,sqls:string[]=[]):Client{
 return {query:async(sql:string,params?:unknown[])=>{
  sqls.push(sql);
  if(sql.includes("AS present"))return {rows:[{present:false}]};
  if(sql.includes("AS item"))return {rows:[{
   item:available,assess:false,roam:false,vigilance:false,links:false
  }]};
  if(sql.includes("FROM public.smn_registry_item r")){
   assert.deepEqual(params,["team-1"]);
   return {rows};
  }
  return {rows:[]};
 }} as unknown as Client;
}
const today="2026-10-25";
test("0: seul un producteur présent et ayant évalué les fiches peut attester zéro",async()=>{
 const result=await readAttention(dbWithItems([]),"team-1",null,today);
 assert.equal(result.state,"available");
 if(result.state!=="available")return;
 assert.equal(result.alerts.length,0);
 assert.equal(result.days,3);
 assert.deepEqual(parseRegistryAttentionPayload(result)?.alerts,[]);
});
test("source absente : état indisponible, jamais une liste vide attestée",async()=>{
 const result=await readAttention(dbWithItems([],false),"team-1",null,today);
 assert.deepEqual(result,{state:"unavailable",reason:"registry-not-installed"});
 assert.equal(parseRegistryAttentionPayload(result),null);
});
test("1: un obstacle ouvert produit un point, à raison vérifiée",async()=>{
 const rows=[{id:"id-1",type:"obstacle",title:"Obstacle vérifié",status:"open",dueOn:null,
  probability:null,impact:null,roam:null,atRisk:false}];
 const sqls:string[]=[];
 const result=await readAttention(dbWithItems(rows,true,sqls),"team-1",null,today);
 assert.equal(result.state,"available");
 if(result.state!=="available")return;
 assert.equal(result.alerts.length,1);
 assert.equal(result.alerts[0].reason,"obstacle");
 assert.match(sqls.at(-1)!,/WHERE r\.team_id=\$1/);
});
test(">5: chaque attention réelle est conservée, sans limite arbitraire",async()=>{
 const rows=Array.from({length:7},(_,i)=>({
  id:"id-"+i,type:"obstacle",title:"Obstacle "+i,status:"open",dueOn:null,
  probability:null,impact:null,roam:null,atRisk:false
 }));
 const result=await readAttention(dbWithItems(rows),"team-1",null,today);
 assert.equal(result.state,"available");
 if(result.state!=="available")return;
 assert.equal(result.alerts.length,7);
 assert.equal(parseRegistryAttentionPayload(result)?.alerts.length,7);
});
test("statut résolu ou risque non évalué : aucun faux point de criticité",async()=>{
 const rows=[
  {id:"resolved",type:"risk",title:"Résolu",status:"resolved",probability:3,impact:3,roam:"owned",dueOn:null,atRisk:false},
  {id:"unknown",type:"risk",title:"Inconnu",status:"open",probability:null,impact:3,roam:"owned",dueOn:null,atRisk:false},
  {id:"high",type:"risk",title:"Critique",status:"open",probability:3,impact:3,roam:"owned",dueOn:null,atRisk:false},
  {id:"resolved-obstacle",type:"obstacle",title:"Résolu",status:"resolved",probability:null,impact:null,roam:null,dueOn:null,atRisk:false}
 ];
 const result=await readAttention(dbWithItems(rows),"team-1",null,today);
 assert.equal(result.state,"available");
 if(result.state!=="available")return;
 assert.deepEqual(result.alerts.map(a=>a.id),["high"]);
 assert.equal(result.alerts[0].reason,"highRisk");
});
test("réponse malformée ou partielle : jamais remplacée par un compteur zéro",()=>{
 assert.equal(parseRegistryAttentionPayload(undefined),null);
 assert.equal(parseRegistryAttentionPayload({alerts:[]}),null);
 assert.equal(parseRegistryAttentionPayload({alerts:"",days:3}),null);
 assert.equal(parseRegistryAttentionPayload({alerts:[alert("1","fictitious")],days:3}),null);
 assert.equal(parseRegistryAttentionPayload({alerts:[{...alert("1"),status:"invalid"}],days:3}),null);
 assert.equal(parseRegistryAttentionPayload({alerts:[alert("1")],days:3})?.alerts.length,1);
 assert.equal(parseRegistryAttentionPayload({alerts:[],days:3})?.alerts.length,0);
});
test("bandeau initialement fermé, compte toujours visible, déploiement accessible et liens",()=>{
 const ui=file("src/app/app/admin/registries/attention-cockpit.tsx");
 assert.match(ui,/useState\(false\)/);
 assert.match(ui,/registryAttention\.count/);
 assert.match(ui,/aria-expanded=\{expanded\}/);
 assert.match(ui,/aria-controls=\{detailsId\}/);
 assert.match(ui,/onClick=\{\(\)=>setExpanded\(value=>!value\)\}/);
 assert.match(ui,/items\.map\(/);
 assert.match(ui,/encodeURIComponent\(item\.id\)/);
 assert.match(ui,/tr\(item\.reason\)/);
 assert.match(ui,/onClick=\{onRetry\}/);
 assert.match(ui,/countUnavailable/);
});
test("page : un seul appel métier partagé avec Liste et Cartes",()=>{
 const page=file("src/app/app/admin/registries/page.tsx");
 const list=file("src/app/app/admin/registries/registry-list.tsx");
 const band=file("src/app/app/admin/registries/attention-cockpit.tsx");
 assert.equal((list.match(/fetch\("\/api\/admin\/registries\/attention\?"/g)||[]).length,1);
 assert.ok(list.includes("<AttentionCockpit items={attention}"));
 assert.ok(list.includes("parseRegistryAttentionPayload("));
 assert.ok(!page.includes("<AttentionCockpit/>"));
 assert.ok(!band.includes("fetch("));
 assert.ok(list.includes("attention?.filter(signal=>signal.id===item.id)"));
});
test("API rend 503 si producteur non installé et valide autorisation collective",()=>{
 const api=file("src/app/api/admin/registries/attention/route.ts");
 assert.match(api,/authorizeApi\(req,"read",\s*\{type:"collective",exists:true,inScope:true\}\)/);
 assert.match(api,/result\.state==="unavailable"\?503:200/);
 assert.match(api,/lower\(i\.mode\) IN \('scrum','kanban'\)/);
});
test("traductions FR/EN et style de bandeau compact responsive",()=>{
 const fr=JSON.parse(file("src/i18n/fr.json")).registryAttention;
 const en=JSON.parse(file("src/i18n/en.json")).registryAttention;
 for(const k of ["count","countLoading","countUnavailable","expand","collapse","retry","highRisk","obstacle","atRisk","upcoming","overdue"]){
  assert.ok(fr[k],k+" FR");assert.ok(en[k],k+" EN");
 }
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 const css=file("src/app/globals.css");
 assert.ok(css.includes(".smn-registry-attention-band"));
 assert.ok(css.includes("flex-wrap:wrap"));
 assert.ok(css.includes("@media(max-width:575px)"));
});
