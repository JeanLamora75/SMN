import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseRelationSearch,readRelationCandidates} from "../src/server/registries/relation-candidates";
import {changeRelation} from "../src/server/registries/relations";
import {groupRegistryRelations,parseRelationPayload,type RegistryRelation} from "../src/lib/registry-relations-view";
const file=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const id="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const relation:RegistryRelation={id:"33333333-3333-4333-8333-333333333333",sourceId:id,targetId:other,
 targetKind:"record",sourceTitle:"Risque source",sourceType:"risk",sourceStatus:"open",
 targetTitle:"Action réelle",targetType:"action",targetStatus:"todo"};
test("AC2 : recherche bornée, types autorisés, sans UUID de saisie",()=>{
 assert.deepEqual(parseRelationSearch(new URLSearchParams("kind=record&types=decision,obstacle&search=%C3%A9quipe")),
  {kind:"record",types:["decision","obstacle"],search:"équipe"});
 assert.equal(parseRelationSearch(new URLSearchParams("kind=record&types=unknown")),null);
 assert.equal(parseRelationSearch(new URLSearchParams("kind=goal&types=action")),null);
 assert.equal(parseRelationSearch(new URLSearchParams("kind=record&search="+("a".repeat(121)))),null);
 assert.deepEqual(parseRelationSearch(new URLSearchParams("kind=goal")),{
  kind:"goal",types:[],search:""
 });
});
test("AC1 : groupement par catégorie cible et direction intelligible",()=>{
 const incoming:RegistryRelation={...relation,id:"44444444-4444-4444-8444-444444444444",
  sourceId:other,targetId:id,sourceTitle:"Obstacle lié",sourceType:"obstacle",
  sourceStatus:"resolved",targetTitle:"Risque source",targetType:"risk",targetStatus:"open"};
 const groups=groupRegistryRelations([relation,incoming],id);
 assert.deepEqual(groups.map(g=>g.type),["obstacle","action"]);
 assert.deepEqual(groups.flatMap(g=>g.items.map(x=>x.direction)),["incoming","outgoing"]);
 assert.equal(groups[0].items[0].linkedStatus,"resolved");
});
test("AC1/5 : les statuts ou identités absents rendent la source indisponible, pas vide",()=>{
 assert.equal(parseRelationPayload({relations:[{...relation,targetStatus:null}]},id),null);
 assert.equal(parseRelationPayload({relations:[{...relation,sourceType:"unknown"}]},id),null);
 assert.equal(parseRelationPayload({relations:[]},id)?.length,0);
 assert.equal(parseRelationPayload({relations:[relation]},id)?.length,1);
});
test("AC2 : aucune recherche d'une autre équipe et résultat trié et borné",async()=>{
 const queries:{sql:string;params:unknown[]|undefined}[]=[];
 const db={query:async(sql:string,params?:unknown[])=>{
  queries.push({sql,params});
  if(sql.includes("SELECT r.team_id,r.type"))return {rows:[{team_id:"team-one",type:"risk"}]};
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  return {rows:[{id:other,title:"Action réelle",type:"action",status:"todo"}]};
 }} as unknown as Client;
 const response=await readRelationCandidates(db,id,{kind:"record",types:["action"],search:"Action"});
 assert.deepEqual(response,{state:"available",items:[{id:other,title:"Action réelle",type:"action",status:"todo"}]});
 const q=queries.at(-1)!;
 assert.match(q.sql,/r.team_id=\$1/);
 assert.match(q.sql,/LIMIT 25/);
 assert.match(q.sql,/r.id<>\$2/);
 assert.deepEqual(q.params?.slice(0,2),["team-one",id]);
});
test("AC2 : absence du producteur signalée au lieu de résultat vide",async()=>{
 const db={query:async(sql:string)=>{
  if(sql.includes("SELECT r.team_id,r.type"))return {rows:[{team_id:"team-one",type:"risk"}]};
  return {rows:[{present:false}]};
 }} as unknown as Client;
 const value=await readRelationCandidates(db,id,{kind:"record",types:[],search:""});
 assert.deepEqual(value,{state:"unavailable"});
});
test("AC2 : objectifs seulement pour Action, cycles clos non proposés",async()=>{
 const q:string[]=[];
 const db={query:async(sql:string)=>{
  q.push(sql);
  if(sql.includes("SELECT r.team_id,r.type"))return {rows:[{team_id:"team-one",type:"action"}]};
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  return {rows:[{id:other,title:"Objectif réel",type:"goal"}]};
 }} as unknown as Client;
 const x=await readRelationCandidates(db,id,{kind:"goal",types:[],search:"Sprint"});
 assert.ok(x);
 assert.equal(x.state,"available");
 assert.ok(q.at(-1)?.includes("s.status<>'closed'"));
 assert.ok(q.at(-1)?.includes("s.team_id=$1"));
});
test("AC3 : confirmation explique que les fiches restent intactes",()=>{
 const ui=file("src/app/app/admin/registries/registry-relations.tsx");
 assert.ok(ui.includes('window.confirm(tr(target.kind==="goal"?"confirmUnlinkGoal":"confirmUnlink"))'));
 assert.ok(ui.includes("method:\"PATCH\""));
 assert.ok(ui.includes('"unlinked",row.relation.sourceId'));
});
test("AC1/2 : titres cliquables, type, statut, sens, aucune catégorie vide",()=>{
 const ui=file("src/app/app/admin/registries/registry-relations.tsx");
 assert.ok(ui.includes("groupRegistryRelations"));
 assert.ok(ui.includes("parseRelationPayload"));
 assert.ok(ui.includes("registryCreate."));
 assert.ok(ui.includes("registryDetailHref(row.linkedId,navigation"));
 assert.ok(ui.includes("RegistryTargetSearch"));
 const picker=file("src/app/app/admin/registries/registry-target-search.tsx");
 assert.ok(picker.includes("relation-candidates"));
 assert.ok(picker.includes("items.map(candidate"));
 assert.ok(!ui.includes("maxLength={36}"));
});
test("AC4 : le serveur retire seulement le lien et garde l'audit",()=>{
 const server=file("src/server/registries/relations.ts");
 assert.match(server,/DELETE FROM public.smn_registry_relation WHERE source_id=/);
 assert.match(server,/INSERT INTO public.smn_registry_relation_audit/);
 assert.ok(!server.includes("DELETE FROM public.smn_registry_item"));
 assert.match(server,/x.status<>'closed'/);
});
test("AC3/4 : cycles clos et associations existantes confirmées séparément",()=>{
 const cycles=file("src/app/app/admin/registries/registry-cycles.tsx");
 const server=file("src/server/registries/cycle-links.ts");
 assert.ok(cycles.includes("window.confirm(tr(\"confirmUnlink\"))"));
 assert.ok(cycles.includes('closed||busy!==null'));
 assert.ok(server.includes("s.status<>'closed'"));
 assert.ok(!server.includes("DELETE FROM public.smn_registry_item"));
});
test("AC2/3 : liens d'action sans UUID et dissociation confirmée",()=>{
 const ui=file("src/app/app/admin/registries/action-links.tsx");
 assert.ok(ui.includes("RegistryTargetSearch"));
 assert.ok(ui.includes('const allowed=["decision","obstacle"]'));
 assert.ok(ui.includes("window.confirm(tr(\"confirmUnlink\"))"));
 assert.ok(!ui.includes("maxLength={36}"));
});
test("AC5 : accès collectif lecture, écriture admin et GET sans mutation",()=>{
 const source=file("src/app/api/admin/registries/[id]/relation-candidates/route.ts");
 assert.ok(source.includes('authorizeApi(req,"read",{type:"collective"'));
 assert.ok(source.includes("withLegacyRegistryReadDb"));
 assert.ok(!source.includes("withAuthDb"));
 const change=file("src/app/api/admin/registries/[id]/relations/route.ts");
 assert.ok(change.includes('authorizeApi(req,"write",{type:"settings"'));
});
test("FR/EN et présentation responsive en accord avec la fiche",()=>{
 const fr=JSON.parse(file("src/i18n/fr.json"));
 const en=JSON.parse(file("src/i18n/en.json"));
 assert.deepEqual(Object.keys(fr.registryRelations).sort(),Object.keys(en.registryRelations).sort());
 assert.deepEqual(Object.keys(fr.actionLinks).sort(),Object.keys(en.actionLinks).sort());
 assert.deepEqual(Object.keys(fr.registryCycles).sort(),Object.keys(en.registryCycles).sort());
 const css=file("src/app/globals.css");
 assert.ok(css.includes(".smn-registry-relation-category"));
 assert.ok(css.includes("@media(max-width:575px)"));
});

test("AC3/4 : dissociation d'une relation sortante n'efface ni fiche, ni autre lien",async()=>{
 const sql:{text:string;params?:unknown[]}[]=[];
 const db={query:async(text:string,params?:unknown[])=>{
  sql.push({text,params});
  if(text.startsWith("SELECT to_regclass(")&&text.endsWith(" AS present"))return {rows:[{present:"migrated"}]};
  if(text.includes("SELECT r.team_id,r.type FROM public.smn_registry_item"))
   return {rows:[{team_id:"team-one",type:"risk"}]};
  if(text.includes("SELECT r.id,r.type FROM public.smn_registry_item"))
   return {rows:[{id:other,type:"action"}]};
  if(text.includes("SELECT id FROM public.smn_registry_relation"))
   return {rows:[{id:relation.id}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await changeRelation(db,"actor-one",id,{kind:"record",id:other},"unlinked");
 assert.deepEqual(result,{ok:true});
 assert.equal(sql[0].text,"BEGIN");
 assert.equal(sql.at(-1)?.text,"COMMIT");
 const deletion=sql.find(x=>x.text.includes("DELETE FROM public.smn_registry_relation"));
 assert.deepEqual(deletion?.params,[id,"record",other]);
 assert.ok(sql.some(x=>x.text.includes("INSERT INTO public.smn_registry_relation_audit")));
 assert.ok(!sql.some(x=>/DELETE FROM public.smn_registry_item|DELETE FROM public.smn_sprint/.test(x.text)));
});
test("AC4 : un objectif appartenant à un Sprint clos reste impossible à dissocier",async()=>{
 const sql:string[]=[];
 const db={query:async(text:string)=>{
  sql.push(text);
  if(text.includes("SELECT r.team_id,r.type FROM public.smn_registry_item"))
   return {rows:[{team_id:"team-one",type:"action"}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await changeRelation(db,"actor-one",id,{kind:"goal",id:other},"unlinked");
 assert.deepEqual(result,{ok:false,error:"not-found"});
 assert.equal(sql.at(-1),"ROLLBACK");
 assert.ok(!sql.some(x=>x.includes("DELETE FROM public.smn_registry_relation")));
});
test("AC5 : la recherche n'accepte ni origine absente ni objectif pour une fiche non Action",async()=>{
 const queries:string[]=[];
 const db={query:async(sql:string)=>{
  queries.push(sql);
  if(sql.includes("SELECT r.team_id,r.type"))return {rows:[{team_id:"team-one",type:"risk"}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await readRelationCandidates(db,id,{kind:"goal",types:[],search:""});
 assert.equal(result,null);
 assert.equal(queries.some(q=>q.includes("smn_sprint_goal")),false);
});
test("AC4 : le cycle d'un objectif lié est fondé, sans statut fictif",()=>{
 assert.equal(parseRelationPayload({relations:[{
  ...relation,sourceType:"action",sourceStatus:"todo",
  targetKind:"goal",targetType:"goal",targetStatus:null,targetCycleStatus:"closed"
 }]},id)?.[0].targetCycleStatus,"closed");
 const view=file("src/app/app/admin/registries/registry-relations.tsx");
 assert.ok(view.includes('row.relation.targetCycleStatus==="closed"'));
});
