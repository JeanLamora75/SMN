import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseSummaryRelations,parseSummaryCycles,validRegistryActivityTime} from "../src/lib/registry-summary-context";
import {readRelations} from "../src/server/registries/relations";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const id="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const goal="33333333-3333-4333-8333-333333333333";
const relation="44444444-4444-4444-8444-444444444444";

test("relations : vide vérifié distinct d'indisponibilité",()=>{
 assert.deepEqual(parseSummaryRelations({relations:[]},id),[]);
 assert.equal(parseSummaryRelations(undefined,id),null);
 assert.equal(parseSummaryRelations({error:"not-found"},id),null);
 assert.equal(parseSummaryRelations({relations:"not-an-array"},id),null);
});

test("relations : fiche entrante/sortante et objectif vérifiés seulement",()=>{
 const a={id:relation,sourceId:id,targetId:other,targetKind:"record",sourceTitle:"Source",targetTitle:"Cible"};
 const b={...a,sourceId:other,targetId:id};
 const c={...a,targetId:goal,targetKind:"goal",targetTitle:"Objectif"};
 assert.deepEqual(parseSummaryRelations({relations:[a,b,c]},id),[a,b,c]);
 assert.equal(parseSummaryRelations({relations:[{...a,targetTitle:null}]},id),null);
 assert.equal(parseSummaryRelations({relations:[{...a,sourceId:goal,targetId:other}]},id),null);
});

test("cycles : seuls les identifiants réellement associés sont affichés",()=>{
 const a={id,name:"Sprint 1",status:"closed"};
 const b={id:other,name:"Sprint 2",status:"active"};
 assert.deepEqual(parseSummaryCycles({cycles:[a,b],linkedIds:[other]}),[b]);
 assert.deepEqual(parseSummaryCycles({cycles:[a,b],linkedIds:[]}),[]);
 assert.equal(parseSummaryCycles({cycles:[a],linkedIds:[other]}),null);
 assert.equal(parseSummaryCycles({cycles:"unavailable",linkedIds:[]}),null);
 assert.equal(parseSummaryCycles({cycles:[{...a,name:""}],linkedIds:[id]}),null);
});

test("activité horodatée : date persistée seulement, aucune date fictive",()=>{
 assert.equal(validRegistryActivityTime(null),null);
 assert.equal(validRegistryActivityTime("2026-10-25"),null);
 assert.equal(validRegistryActivityTime("test"),null);
 assert.equal(validRegistryActivityTime("2026-10-25T10:42:00.000Z"),"2026-10-25T10:42:00.000Z");
 assert.equal(validRegistryActivityTime("2026-10-25 10:42:00.000+00"),"2026-10-25 10:42:00.000+00");
 assert.equal(validRegistryActivityTime("2026-10-25 10:42:00"),null);
});

test("le panneau principal et latéral suivent exactement le contrat de structure",()=>{
 const s=source("src/app/app/admin/registries/registry-summary.tsx");
 const css=source("src/app/globals.css");
 assert.match(s,/smn-registry-summary-main/);
 assert.match(s,/smn-registry-summary-side/);
 assert.match(css,/grid-template-columns:minmax\(0,2fr\) minmax\(0,1fr\)/);
 assert.match(css,/@media\(max-width:991px\)/);
 assert.match(css,/\.smn-registry-summary-grid\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/overflow-wrap:anywhere/);
});

test("description entière, sans le clamp 2 lignes de la vue Liste",()=>{
 const s=source("src/app/app/admin/registries/registry-summary.tsx");
 assert.match(s,/className="smn-registry-detail-description"/);
 assert.match(s,/\{item\.description\}/);
 assert.ok(!s.includes("slice(0,"));
 assert.ok(!s.includes("smn-registry-row-description"));
});

test("journal réel : le commentaire legacy est affiché séparément, jamais comme entrée datée",()=>{
 const s=source("src/app/app/admin/registries/registry-summary.tsx");
 const journal=source("src/app/app/admin/registries/registry-journal.tsx");
 assert.match(s,/<RegistryJournal/);
 assert.ok(!s.includes("canManage&&item.comment"));
 assert.match(journal,/data\?\.legacy/);
 assert.match(journal,/commentsText\("legacyUndated"\)/);
 assert.ok(!journal.includes("sampleComment"));
 assert.ok(!journal.includes("commentHistory.map"));
});

test("contextes : aucun cycle proposé n'est confondu avec un cycle lié",()=>{
 const s=source("src/app/app/admin/registries/registry-summary.tsx");
 assert.match(s,/parseSummaryCycles/);
 assert.match(s,/parseSummaryRelations/);
 assert.match(s,/registryDetailHref\(record\.id,navigation\)/);
 assert.match(s,/cyclesApplicable/);
 assert.match(s,/tr\("cyclesUnsupported"\)/);
 assert.match(s,/relations\.state==="unavailable"/);
 assert.match(s,/cycles\.state==="unavailable"/);
});

test("activité : rôle user sans dates privées ; admin avec dates de la vraie fiche",()=>{
 const s=source("src/app/app/admin/registries/registry-summary.tsx");
 const api=source("src/app/api/admin/registries/[id]/route.ts");
 assert.match(s,/const created=canManage\?/);
 assert.match(s,/!canManage\?<p/);
 assert.match(api,/owner,comment,revision,createdAt,updatedAt/);
 assert.match(s,/timeZone:"Europe\/Paris"/);
});

test("édition description : crayon admin, modale, version, 409, draft non perdu",()=>{
 const s=source("src/app/app/admin/registries/registry-description-editor.tsx");
 const scoped=source("src/app/app/admin/registries/registry-core-editor.tsx");
 const detail=source("src/app/app/admin/registries/registry-detail.tsx");
 assert.match(s,/<dialog/);
 assert.match(s,/element\.showModal\(\)/);
 assert.match(s,/method:"PATCH"/);
 assert.match(s,/revision:item\.revision/);
 assert.match(s,/response\.status===409/);
 assert.match(s,/!response\.ok/);
 assert.match(s,/if\(dirty&&!window\.confirm/);
 assert.ok(!detail.includes("<RegistryCreate "));
 assert.ok(scoped.includes("description:item.description"));
 assert.match(detail,/canManage&&descriptionEditing/);
 assert.match(detail,/onEditDescription=\{canManage/);
});

test("le producteur de relations scinde les titres sur la même équipe",async()=>{
 const sqls:{sql:string;params:unknown[]|undefined}[]=[];
 const db={query:async(sql:string,params?:unknown[])=>{
  sqls.push({sql,params});
  if(sql.includes('r.team_id AS "teamId"'))return {rows:[{teamId:"team-1"}]};
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  return {rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await readRelations(db,id),{relations:[]});
 const query=sqls.find(x=>x.sql.includes("FROM public.smn_registry_relation l"));
 assert.ok(query);
 assert.deepEqual(query.params,[id,"team-1"]);
 assert.match(query.sql,/s\.team_id=\$2/);
 assert.match(query.sql,/r\.team_id=\$2/);
 assert.match(source("src/server/registries/relations.ts"),/x\.team_id=\$2/);
});

test("FR/EN : mêmes clés, droits et états vides accessibles",()=>{
 const fr=JSON.parse(source("src/i18n/fr.json")).registrySummary;
 const en=JSON.parse(source("src/i18n/en.json")).registrySummary;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of ["heading","description","journal","journalPending","noCycles",
  "noRelations","unavailable","activityRestricted","editDescription","discardChanges","save","error"]){
  assert.ok(fr[key],key+" FR");assert.ok(en[key],key+" EN");
 }
});
