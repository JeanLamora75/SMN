import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 enterRegistryRelation,parseRegistryIndexState,parseRegistryNavigation,
 registryDetailHref,registryIndexPath,registryIndexUrl,registryScrollKey,
 safeRegistryIndexPath
} from "../src/lib/registry-navigation";

const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const risk="11111111-1111-4111-8111-111111111111";
const action="22222222-2222-4222-8222-222222222222";
const decision="33333333-3333-4333-8333-333333333333";
const other="44444444-4444-4444-8444-444444444444";

test("AC2 : tous les filtres, cycle, page, tri et vue survivent à un retour",()=>{
 const state={
  type:"risk" as const,search:"blocage du sprint",status:"open",
  owner:"Responsable",lifecycle:"followup" as const,sort:"titleAsc" as const,
  cycleId:other,page:3,view:"cards" as const
 };
 const url=registryIndexUrl(state);
 assert.deepEqual(parseRegistryIndexState(url),state);
 assert.equal(safeRegistryIndexPath(url),url);
 const href=registryDetailHref(risk,{origin:url,trail:[]});
 const params=new URL(href,"https://smn.invalid").searchParams;
 assert.equal(params.get("origin"),url);
 const restored=parseRegistryNavigation({origin:params.get("origin")},risk);
 assert.equal(restored.origin,url);
 assert.equal(registryScrollKey(restored.origin),registryScrollKey(url));
});

test("AC1/3 : chaîne Risque → Action → Décision → Risque et retour précédent",()=>{
 const origin=registryIndexUrl({...parseRegistryIndexState(registryIndexPath),
  type:"dependency",search:"transverse",page:2});
 const first=parseRegistryNavigation({origin},risk);
 const second=enterRegistryRelation(first,risk);
 const third=enterRegistryRelation(second,action);
 const fourth=enterRegistryRelation(third,decision);
 assert.deepEqual(fourth.trail,[risk,action,decision]);
 const link=registryDetailHref(risk,fourth);
 const target=new URL(link,"https://smn.invalid");
 assert.equal(target.pathname,registryIndexPath+"/"+risk);
 const loaded=parseRegistryNavigation({
  origin:target.searchParams.get("origin"),trail:target.searchParams.get("trail")
 },risk);
 assert.deepEqual(loaded.trail,[risk,action,decision]);
 assert.equal(loaded.origin,origin);
 const back=registryDetailHref(decision,{origin:loaded.origin,trail:loaded.trail.slice(0,-1)});
 assert.equal(new URL(back,"https://smn.invalid").searchParams.get("trail"),[risk,action].join(","));
});

test("AC3/5 : URL directe, origine externe, chemin dangereux et chaîne falsifiée",()=>{
 assert.deepEqual(parseRegistryNavigation({},risk),{origin:registryIndexPath,trail:[]});
 for(const value of ["https://malicious.example", "//malicious.example", "/login",
  "/app/admin/registries/create","/app/admin/registries?returnTo=%2Fapp%2Fadmin",
  "/app/admin/registries?type=risk&next=%2Fapp%2Fadmin", "/app/admin/registries\\evil"]){
  assert.equal(safeRegistryIndexPath(value),registryIndexPath,value);
 }
 assert.deepEqual(parseRegistryNavigation({trail:action+",not-uuid"},risk).trail,[]);
 assert.deepEqual(parseRegistryNavigation({trail:Array(9).fill(action).join(",")},risk).trail,[]);
 assert.equal(registryDetailHref("not-a-uuid",{origin:registryIndexPath,trail:[]}),registryIndexPath);
});

test("AC2 : pages et statuts invalides normalisés, sans fabriquer une catégorie",()=>{
 const state=parseRegistryIndexState(
  registryIndexPath+"?type=unknown&status=imaginary&page=-7&sort=hacked&view=other&cycleId=hacked"
 );
 assert.equal(state.type,"all");
 assert.equal(state.status,"");
 assert.equal(state.page,1);
 assert.equal(state.sort,"default");
 assert.equal(state.view,"list");
 assert.equal(state.cycleId,"");
});

test("AC1/2 : liste, cartes, relations, journal et synthèse propagent l'origine",()=>{
 const list=file("src/app/app/admin/registries/registry-list.tsx");
 const detail=file("src/app/app/admin/registries/registry-detail.tsx");
 assert.match(list,/parseRegistryIndexState/);
 assert.match(list,/window\.addEventListener\("popstate"/);
 assert.match(list,/sessionStorage\.setItem/);
 assert.match(list,/onNavigate=\{savePosition\}/);
 assert.match(detail,/RegistryBreadcrumbs/);
 assert.match(detail,/enterRegistryRelation\(navigation,id\)/);
 for(const name of ["registry-list-row.tsx","registry-card.tsx","registry-relations.tsx",
  "registry-summary.tsx","registry-journal.tsx","action-links.tsx"])
  assert.match(file("src/app/app/admin/registries/"+name),/registryDetailHref/,name);
});

test("AC4/5 : protection brouillon et accès explicite, sans changer les APIs",()=>{
 const detail=file("src/app/app/admin/registries/registry-detail.tsx");
 const journal=file("src/app/app/admin/registries/registry-journal.tsx");
 assert.match(detail,/data-registry-dirty/);
 assert.match(detail,/window\.confirm/);
 assert.match(journal,/data-registry-dirty/);
 assert.match(journal,/beforeunload/);
 assert.match(detail,/notFound/);
 assert.match(detail,/unavailable/);
});

test("AC1/3/5 : libellés FR/EN et ancêtres contrôlés sur leur équipe",()=>{
 const fr=JSON.parse(file("src/i18n/fr.json")).registryNavigation;
 const en=JSON.parse(file("src/i18n/en.json")).registryNavigation;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const value of Object.values(fr) as string[])assert.ok(value.trim().length>0);
 for(const value of Object.values(en) as string[])assert.ok(value.trim().length>0);
 const breadcrumb=file("src/app/app/admin/registries/registry-breadcrumbs.tsx");
 assert.match(breadcrumb,/record\.teamId!==teamId/);
 assert.match(breadcrumb,/!response\.ok/);
 assert.match(breadcrumb,/breadcrumb-item/);
});
