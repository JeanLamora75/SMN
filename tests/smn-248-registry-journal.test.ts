import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseJournalPayload,buildJournalEntries,filterJournalEntries} from "../src/lib/registry-journal";
import {readRegistryJournalLinks} from "../src/server/registries/journal-links";
const file=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const recordId="11111111-1111-4111-8111-111111111111";
const actionId="22222222-2222-4222-8222-222222222222";
const comment={id:"33333333-3333-4333-8333-333333333333",text:"Suivi vérifié",
 revision:1,createdAt:"2026-10-25 08:00:00+00",editedAt:null,withdrawnAt:null,
 edited:false,withdrawn:false,authorName:"admin",editorName:null,withdrawnByName:null};
const link={id:"44444444-4444-4444-8444-444444444444",recordId:actionId,
 title:"Action réelle",type:"action",recordedAt:"2026-10-25 10:00:00+00",
 authorName:"admin",eventKind:"linked"};
const payload={comments:[comment],events:[link],legacy:null};

test("AC1 : construit une chronologie du plus récent au plus ancien, sans inventer de création",()=>{
 const p=parseJournalPayload(payload);assert.ok(p);
 const entries=buildJournalEntries(p);
 assert.deepEqual(entries.map(x=>x.kind),["link","comment"]);
 assert.equal(entries[0].at,link.recordedAt);
 assert.equal(entries[1].at,comment.createdAt);
 const first=entries[0];
 if(first.kind!=="link")assert.fail("La première entrée doit être une fiche liée");
 assert.equal(first.recordId,actionId);
});
test("AC1 : les vraies corrections et retraits sont ordonnés selon la date d'activité",()=>{
 const comments=[
  {...comment,edited:true,editedAt:"2026-10-25 11:00:00+00",revision:2},
  {...comment,id:"55555555-5555-4555-8555-555555555555",text:null,withdrawn:true,
   withdrawnAt:"2026-10-25 12:00:00+00",revision:2}
 ];
 const parsed=parseJournalPayload({comments,events:[link],legacy:null});assert.ok(parsed);
 const entries=buildJournalEntries(parsed);
 assert.deepEqual(entries.map(x=>x.at),[
  "2026-10-25 12:00:00+00","2026-10-25 11:00:00+00",link.recordedAt
 ]);
});
test("AC3 : filtres commentaire/action/décision/fait sans changement de données",()=>{
 const entries=buildJournalEntries(parseJournalPayload(payload)!);
 assert.equal(filterJournalEntries(entries,"all").length,2);
 assert.equal(filterJournalEntries(entries,"comments").length,1);
 assert.equal(filterJournalEntries(entries,"action").length,1);
 assert.deepEqual(filterJournalEntries(entries,"decision"),[]);
 assert.deepEqual(filterJournalEntries(entries,"highlight"),[]);
});
test("AC4 : source incomplète ne devient pas un journal vide artificiel",()=>{
 assert.equal(parseJournalPayload(undefined),null);
 assert.equal(parseJournalPayload({comments:[],events:[],legacy:undefined}),null);
 assert.equal(parseJournalPayload({comments:[{...comment,createdAt:"invalid"}],events:[],legacy:null}),null);
 assert.equal(parseJournalPayload({comments:[],events:[{...link,type:"risk"}],legacy:null}),null);
 assert.equal(parseJournalPayload({comments:[{...comment,withdrawn:true,text:"leaked",withdrawnAt:"2026-10-25 12:00:00+00"}],events:[],legacy:null}),null);
});
test("AC4 : commentaire legacy séparé, ni date ni auteur inventés",()=>{
 const p=parseJournalPayload({comments:[],events:[],
  legacy:{text:"Ancien commentaire",author:null,recordedAt:null,origin:"legacy"}});
 assert.ok(p);assert.equal(buildJournalEntries(p).length,0);
 assert.equal(p.legacy?.text,"Ancien commentaire");
});
test("AC1 / RBAC : audit d'association réelle seulement, cible bornée à l'équipe",async()=>{
 const queries:string[]=[];
 const db={query:async(sql:string)=>{
  queries.push(sql);
  if(sql.includes("SELECT to_regclass"))return {rows:[{ready:true}]};
  return {rows:[{id:link.id,recordId:actionId,title:link.title,type:"action",
   recordedAt:link.recordedAt,authorName:"admin"}]};
 }} as unknown as Client;
 const result=await readRegistryJournalLinks(db,recordId,true);
 assert.deepEqual(result,[link]);
 const statement=queries.at(-1)!;
 assert.match(statement,/smn_registry_relation_audit/);
 assert.match(statement,/audit\.action='linked'/);
 assert.match(statement,/r\.team_id=base\.team_id/);
 assert.match(statement,/l\.created_at<=audit\.changed_at/);
 assert.match(statement,/r\.type IN \('action','decision','highlight'\)/);
});
test("AC5 : aucun lien fictif si tables d'associations absentes",async()=>{
 const db={query:async(sql:string)=>({
  rows:sql.includes("SELECT to_regclass")?[{ready:false}]:[]
 })} as unknown as Client;
 assert.deepEqual(await readRegistryJournalLinks(db,recordId,false),[]);
});
test("AC2 : saisie inline, POST confirmé avant nettoyage, brouillon conservé sur erreur",()=>{
 const ui=file("src/app/app/admin/registries/registry-journal.tsx");
 assert.match(ui,/role="status"/);
 assert.match(ui,/method:"POST"/);
 assert.match(ui,/response\.status!==201/);
 assert.match(ui,/setDraft\(""\)/);
 assert.match(ui,/setError\("unavailable"\)/);
 assert.ok(!ui.includes("<dialog"));
});
test("AC3 : correction 409 conserve saisie, retrait confirmé et versions admin",()=>{
 const ui=file("src/app/app/admin/registries/registry-journal.tsx");
 assert.match(ui,/method:"PATCH"/);
 assert.match(ui,/method:"DELETE"/);
 assert.match(ui,/response\.status===409/);
 assert.match(ui,/window\.confirm/);
 assert.match(ui,/revision:comment\.revision/);
 assert.match(ui,/canManage&&/);
 assert.match(ui,/\/revisions"/);
});
test("AC1 / AC5 : journal Synthèse et lien fiche autonome, pas d'audit technique dupliqué",()=>{
 const summary=file("src/app/app/admin/registries/registry-summary.tsx");
 const ui=file("src/app/app/admin/registries/registry-journal.tsx");
 assert.match(summary,/<RegistryJournal/);
 assert.ok(!summary.includes('tr("journalPending")'));
 assert.ok(!summary.includes("canManage&&item.comment"));
 assert.match(ui,/registryDetailHref\(entry\.recordId,navigation\)/);
 assert.ok(!ui.includes("RegistryHistory"));
});
test("AC5 : API journal unique respecte périmètre collectif et lecture seule",()=>{
 const api=file("src/app/api/admin/registries/[id]/journal/route.ts");
 assert.match(api,/authorizeApi\(req,"read",\{type:"collective"/);
 assert.match(api,/withLegacyRegistryReadDb/);
 assert.ok(!api.includes("withAuthDb"));
 const gate=file("src/server/registries/legacy-read.ts");
 assert.match(gate,/withSprintIndexDb|schema_version|schemaVersion/);
 assert.match(api,/readRegistryComments\(db,id,actor\.role==="admin"\)/);
});
test("AC6 : FR/EN, thème, zoom et filtres accessibles",()=>{
 const fr=JSON.parse(file("src/i18n/fr.json")).registryJournal;
 const en=JSON.parse(file("src/i18n/en.json")).registryJournal;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of ["all","comments","action","decision","highlight","emptyFiltered",
  "reset","submit","withdrawn","edited","loading","unavailable"]){
  assert.ok(fr[key]&&en[key],key);
 }
 const css=file("src/app/globals.css");
 assert.ok(css.includes(".smn-registry-journal"));
 assert.ok(css.includes("@media(max-width:575px)"));
});

test("AC3 : une correction sans editedAt vérifié est refusée par le lecteur",()=>{
 assert.equal(parseJournalPayload({comments:[{...comment,edited:true}],events:[],legacy:null}),null);
 assert.equal(parseJournalPayload({comments:[{...comment,editedAt:"2026-10-25 09:00:00+00"}],events:[],legacy:null}),null);
});
test("AC5 : auteur d'association non communiqué au lecteur collectif",async()=>{
 const queries:string[]=[];
 const db={query:async(sql:string)=>{
  queries.push(sql);
  if(sql.includes("SELECT to_regclass"))return {rows:[{ready:true}]};
  return {rows:[{...link,authorName:null}]};
 }} as unknown as Client;
 const result=await readRegistryJournalLinks(db,recordId,false);
 assert.equal(result[0].authorName,null);
 assert.ok(queries.at(-1)?.includes('NULL::text AS "authorName"'));
 assert.ok(!queries.some(s=>/INSERT INTO|DELETE FROM|UPDATE public|CREATE TABLE/.test(s)));
});
test("AC2/AC3 : le brouillon de correction est protégé et seuls les administrateurs voient les actions",()=>{
 const ui=file("src/app/app/admin/registries/registry-journal.tsx");
 assert.match(ui,/window\.confirm\(tr\("discardEdit"\)\)/);
 assert.match(ui,/beforeunload/);
 assert.match(ui,/canManage&&<form/);
 assert.match(ui,/canManage&&<div className="smn-registry-journal-actions"/);
 assert.match(ui,/readVersions\(entry\.comment\.id,true\)/);
 assert.match(ui,/aria-controls=\{editorId\+"-versions-"/);
 assert.match(ui,/setSuccess\(true\)/);
});

test("création liée explicitement prouvée : événement de création distinct de l'association",()=>{
 const p=parseJournalPayload({comments:[],events:[{...link,eventKind:"created"}],legacy:null});
 assert.ok(p);
 const entries=buildJournalEntries(p);
 assert.equal(entries[0].kind,"link");
 if(entries[0].kind==="link")assert.equal(entries[0].eventKind,"created");
 assert.equal(parseJournalPayload({comments:[],events:[{...link,eventKind:"invented"}],legacy:null}),null);
});
