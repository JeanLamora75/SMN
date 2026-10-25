import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseInitialDetails} from "../src/server/registries/initial-details";
import {createRegistryItem} from "../src/server/registries/items";
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
 assert.ok(code.includes("registryTypes.map"));
 assert.ok(code.includes("registryStatuses[type].map"));
 for(const term of ["probability","impact","roam","requester","contributor","atRisk","rationale"])
  assert.ok(code.includes(term),term);
 assert.ok(code.includes('method:"POST"'));
 assert.ok(code.includes("response.status===201"));
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
