import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseInitialDetails} from "../src/server/registries/initial-details";
import {createRegistryItem} from "../src/server/registries/items";
import {safeRegistryReturnPath} from "../src/lib/registry-return-context";
import type {Client} from "pg";

const file=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const uuid="11111111-1111-4111-8111-111111111111";
test("six types acceptés, aucune obligation métier additionnelle",()=>{
 for(const type of ["risk","obstacle","dependency","decision","action","highlight"] as const)
  assert.deepEqual(parseInitialDetails(type,undefined,"team-one"),{ok:true,value:{}});
});
test("risques : valeurs probabilité/impact/ROAM existantes, sans criticité inventée",()=>{
 assert.equal(parseInitialDetails("risk",{probability:4},"t").ok,false);
 assert.equal(parseInitialDetails("risk",{roam:"unknown"},"t").ok,false);
 assert.equal(parseInitialDetails("risk",{impact:3,probability:2,roam:"resolved"},"t").ok,true);
 assert.equal(parseInitialDetails("risk",{atRisk:true},"t").ok,false);
});
test("dépendances : parties facultatives par paire et contrôle d'équipe",()=>{
 const requester={kind:"local",teamId:"team-one"},contributor={kind:"external",name:"Equipe extérieure"};
 assert.equal(parseInitialDetails("dependency",{requester},"team-one").ok,false);
 assert.equal(parseInitialDetails("dependency",{requester,contributor,atRisk:true},"team-one").ok,true);
 assert.equal(parseInitialDetails("dependency",{requester:{kind:"local",teamId:"other"},contributor},"team-one").ok,false);
});
test("décision : justification optionnelle et longueur bornée",()=>{
 assert.equal(parseInitialDetails("decision",{rationale:""},"t").ok,true);
 assert.equal(parseInitialDetails("decision",{rationale:"a".repeat(4001)},"t").ok,false);
 assert.equal(parseInitialDetails("decision",{probability:1},"t").ok,false);
 assert.equal(parseInitialDetails("decision",{replacesId:uuid},"t").ok,true);
 assert.equal(parseInitialDetails("decision",{replacesId:"invalid"},"t").ok,false);
});
test("POST : les détails, les associations et les audits précèdent le commit unique",()=>{
 const code=file("src/server/registries/items.ts");
 assert.ok(code.includes("parseInitialDetails("));
 assert.ok(code.includes("await writeInitialDetails("));
 assert.ok(code.includes("await ensureRelations(db)"));
 assert.ok(code.includes("smn_registry_relation_audit"));
 const start=code.indexOf("export async function createRegistryItem");
 const end=code.indexOf("export async function readRegistryItem");
 const functionText=code.slice(start,end);
 assert.equal((functionText.match(/await db\.query\("BEGIN"\)/g)||[]).length,1);
 assert.equal((functionText.match(/await db\.query\("COMMIT"\)/g)||[]).length,1);
 assert.ok(functionText.includes("ROLLBACK"));
});
test("modale : champs généraux et métier avant une seule confirmation serveur",()=>{
 const code=file("src/app/app/admin/registries/registry-create-modal.tsx");
 assert.ok(code.includes("<dialog"));
 assert.ok(code.includes("allowedTypes.map"));
 assert.ok(code.includes("linkedFromJournal?linkedJournalTypes:registryTypes"));
 assert.ok(code.includes("registryStatuses[type].map"));
 for(const term of ["probability","impact","roam","requester","contributor","atRisk","rationale"])
  assert.ok(code.includes(term),term);
 assert.ok(code.includes('method:"POST"'));
 assert.ok(code.includes("response.status!==201"));
 assert.ok(code.includes("decisionChoices.map"));
 assert.ok(code.includes("replacesId"));
 assert.ok(code.includes("onCreated("));
 assert.ok(!code.includes("setCreatedId("));
});
test("source et cycle connus envoyés uniquement quand compatibles",()=>{
 const code=file("src/app/app/admin/registries/registry-create-modal.tsx");
 assert.ok(code.includes("sourceId"));
 assert.ok(code.includes('type==="risk"||type==="obstacle"'));
 assert.ok(code.includes("cycleId"));
 assert.ok(code.includes("onCancel"));
 assert.ok(code.includes("window.confirm"));
});
test("liste : modal exclusive, confirmation, rafraîchissement et mise en évidence",()=>{
 const code=file("src/app/app/admin/registries/registry-list.tsx");
 assert.ok(code.includes("RegistryCreateModal"));
 assert.ok(code.includes("setCreatedId(id)"));
 assert.ok(code.includes("setRefresh(n=>n+1)"));
 assert.ok(code.includes("setAttentionRefresh(n=>n+1)"));
 assert.ok(code.includes("createdId===item.id"));
 assert.ok(code.includes("createAnother"));
 assert.ok(!code.includes('href="/app/admin/registries/create"'));
});
test("ancien lien direct de création redirigé vers la modale de la liste",()=>{
 const code=file("src/app/app/admin/registries/create/page.tsx");
 assert.ok(code.includes('redirect("/app/admin/registries?"'));
 assert.ok(code.includes('create:"1"'));
});
test("traductions FR/EN cohérentes et modal centrée sur mobile",()=>{
 const fr=JSON.parse(file("src/i18n/fr.json")).registryCreateModal;
 const en=JSON.parse(file("src/i18n/en.json")).registryCreateModal;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of ["heading","createAnother","viewRecord","discard","invalid","source","success","error"])
  assert.ok(fr[key]&&en[key],key);
 const css=file("src/app/globals.css");
 assert.ok(css.includes(".smn-registry-create-dialog"));
 assert.ok(css.includes("@media(max-width:575px)"));
});

const basic={teamId:"team-one",type:"action",title:"Action réelle",
 occurredOn:"2026-10-25",status:"todo",description:null,owner:null,
 dueOn:null,comment:null};
test("création liée : source bornée équipe, fiches et association validées par le même COMMIT",async()=>{
 const calls:string[]=[];
 const db={query:async(sql:string)=>{
  calls.push(sql);
  if(sql.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:"team-one"}]};
  if(sql.includes("SELECT r.id FROM public.smn_registry_item r")&&sql.includes("FOR UPDATE OF r"))
   return {rows:[{id:uuid}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await createRegistryItem(db,"admin",{...basic,sourceId:uuid});
 assert.equal(result.ok,true);
 assert.ok(calls.some(q=>q.includes("INSERT INTO public.smn_registry_relation")));
 assert.ok(calls.some(q=>q.includes("INSERT INTO public.smn_registry_relation_audit")));
 assert.equal(calls.at(-1),"COMMIT");
 assert.equal(calls.filter(x=>x==="BEGIN").length,1);
});
test("source inexistante : aucune création, transaction annulée",async()=>{
 const calls:string[]=[];
 const db={query:async(sql:string)=>{
  calls.push(sql);
  return {rows:sql.includes("SELECT t.id FROM public.smn_team")?[{id:"team-one"}]:[]};
 }} as unknown as Client;
 const result=await createRegistryItem(db,"admin",{...basic,sourceId:uuid});
 assert.deepEqual(result,{ok:false,error:"not-found"});
 assert.equal(calls.at(-1),"ROLLBACK");
 assert.equal(calls.some(x=>x.includes("INSERT INTO public.smn_registry_item")),false);
});
test("erreur du détail métier : la création et l'audit ne sont jamais commités partiellement",async()=>{
 const calls:string[]=[];
 const db={query:async(sql:string)=>{
  calls.push(sql);
  if(/INSERT INTO public\.smn_decision_detail\s*\(/.test(sql))throw Error("db-failure");
  return {rows:sql.includes("SELECT t.id FROM public.smn_team")?[{id:"team-one"}]:[]};
 }} as unknown as Client;
 await assert.rejects(()=>createRegistryItem(db,"admin",{
  ...basic,type:"decision",status:"cancelled",details:{rationale:"Motif réel"}
 }));
 assert.ok(calls.some(x=>x.includes("INSERT INTO public.smn_registry_item")));
 assert.equal(calls.at(-1),"ROLLBACK");
 assert.equal(calls.includes("COMMIT"),false);
});

test("création de la première fiche possible sans lecteur de liste initialisé",()=>{
 const list=file("src/app/app/admin/registries/registry-list.tsx");
 const page=file("src/app/app/admin/registries/page.tsx");
 assert.ok(list.includes("canManage&&createOpen&&<RegistryCreateModal"));
 assert.ok(list.includes("teamId={teamId}"));
 assert.ok(page.includes("teamId={teamId}"));
});
test("retour sûr au contexte initial, sans URL externe ni redirection récursive",()=>{
 assert.equal(safeRegistryReturnPath("/app/team-calendar"),"/app/team-calendar");
 assert.equal(safeRegistryReturnPath("/app/admin/sprints/123?tab=events"),"/app/admin/sprints/123?tab=events");
 for(const value of ["https://example.com","//example.com","/app/admin/registries/create",
  "/login","/app\\evil",null])assert.equal(safeRegistryReturnPath(value),undefined);
});
test("échec cible remplacée : validation en transaction avant première insertion",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{
  sql.push(q);
  if(q.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:"team-one"}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await createRegistryItem(db,"admin",{
  ...basic,type:"decision",status:"active",details:{replacesId:uuid}
 });
 assert.deepEqual(result,{ok:false,error:"not-found"});
 assert.equal(sql.at(-1),"ROLLBACK");
 assert.equal(sql.some(q=>q.includes("INSERT INTO public.smn_registry_item")),false);
});

test("risque initial : évaluation et ROAM audités dans le même commit",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{
  sql.push(q);
  if(q.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:"team-one"}]};
  return {rows:[]};
 }} as unknown as Client;
 const r=await createRegistryItem(db,"admin",{
  ...basic,type:"risk",status:"open",
  details:{probability:2,impact:3,roam:"resolved"}
 });
 assert.equal(r.ok,true);
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_risk_assessment(")));
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_risk_assessment_audit")));
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_risk_roam(")));
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_risk_roam_audit")));
 assert.equal(sql.at(-1),"COMMIT");
});
test("dépendance : parties réelles et vigilance auditées atomiquement",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{
  sql.push(q);
  return {rows:q.includes("SELECT t.id FROM public.smn_team")?[{id:"team-one"}]:[]};
 }} as unknown as Client;
 const r=await createRegistryItem(db,"admin",{
  ...basic,type:"dependency",status:"open",details:{
   requester:{kind:"local",teamId:"team-one"},
   contributor:{kind:"external",name:"Équipe externe"},atRisk:false
  }
 });
 assert.equal(r.ok,true);
 assert.ok(sql.some(x=>/INSERT INTO public\.smn_dependency_parties\s*\(/.test(x)));
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_dependency_parties_audit")));
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_dependency_vigilance")));
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_dependency_vigilance_audit")));
 assert.equal(sql.at(-1),"COMMIT");
});
test("décision : remplacement explicite vérifié et audité atomiquement",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{
  sql.push(q);
  if(q.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:"team-one"}]};
  if(q.includes("WHERE r.id=$1 AND r.team_id=$2 AND r.type='decision'"))return {rows:[{id:uuid}]};
  return {rows:[]};
 }} as unknown as Client;
 const r=await createRegistryItem(db,"admin",{
  ...basic,type:"decision",status:"cancelled",details:{rationale:"Motif",replacesId:uuid}
 });
 assert.equal(r.ok,true);
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_decision_detail")));
 assert.ok(sql.some(x=>x.includes("INSERT INTO public.smn_decision_detail_audit")));
 assert.equal(sql.at(-1),"COMMIT");
});
