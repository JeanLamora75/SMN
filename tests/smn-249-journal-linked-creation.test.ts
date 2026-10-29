import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {parseLinkedJournalCreation,linkedJournalTypes} from "../src/lib/registry-linked-creation";
import {createRegistryItem,parseRegistryInput} from "../src/server/registries/items";
import {parseInitialDetails} from "../src/server/registries/initial-details";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sourceId="11111111-1111-4111-8111-111111111111";
const requestId="22222222-2222-4222-8222-222222222222";
const base={teamId:"team-1",type:"action",title:"Action du journal",occurredOn:"2026-10-25",
 status:"todo",description:null,owner:null,dueOn:null,comment:null,details:{}};

test("AC1 : seul Action, Décision ou Fait marquant est proposé et accepté par la route",()=>{
 assert.deepEqual(linkedJournalTypes,["action","decision","highlight"]);
 for(const type of linkedJournalTypes)
  assert.equal(parseLinkedJournalCreation({...base,type,requestId})?.type,type);
 for(const type of ["risk","obstacle","dependency"])
  assert.equal(parseLinkedJournalCreation({...base,type,requestId}),null);
});
test("AC3 : source, cycle, auteur et identifiants métier ne sont jamais pris depuis le corps",()=>{
 for(const extra of [{sourceId},{cycleId:sourceId},{actorId:"admin"},{itemId:sourceId},
  {id:sourceId},{foo:"bar"}]){
  assert.equal(parseLinkedJournalCreation({...base,requestId,...extra}),null);
 }
 assert.equal(parseLinkedJournalCreation({...base,requestId:"bad"}),null);
 assert.equal(parseLinkedJournalCreation({...base,requestId,details:{probability:2}}),null);
});
test("AC2 : transaction réutilisée et requête de création idempotente",()=>{
 const code=read("src/server/registries/items.ts");
 const operation=code.slice(code.indexOf("export async function createRegistryItem("),
  code.indexOf("export async function readRegistryItem("));
 assert.match(operation,/await db\.query\("BEGIN"\)/);
 assert.match(operation,/await db\.query\("COMMIT"\)/);
 assert.match(operation,/await db\.query\("ROLLBACK"\)/);
 assert.match(operation,/await ensureRelations\(db\)/);
 assert.match(operation,/smn_registry_relation_audit/);
 assert.match(operation,/smn_registry_item_audit/);
 assert.match(operation,/smn_registry_linked_request/);
 assert.match(operation,/ON CONFLICT DO NOTHING/);
 assert.match(operation,/replayed:true/);
});
test("AC2 : une création liée validée enregistre une seule fiche et son association auditée",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:"team-1"}]};
  if(sql.includes("SELECT r.id FROM public.smn_registry_item r")&&sql.includes("FOR UPDATE OF r"))
   return {rows:[{id:sourceId}]};
  if(sql.includes("ON CONFLICT DO NOTHING"))return {rows:[{request_id:requestId}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await createRegistryItem(db,"actor-1",{...base,sourceId},requestId);
 assert.equal(result.ok,true);
 assert.equal(statements.filter(q=>q.includes("INSERT INTO public.smn_registry_item\n")).length,1);
 assert.equal(statements.filter(q=>q.includes("INSERT INTO public.smn_registry_relation\n")).length,1);
 assert.ok(statements.some(q=>q.includes("INSERT INTO public.smn_registry_relation_audit")));
 assert.equal(statements.at(-1),"COMMIT");
});
test("AC2 : un deuxième envoi de la même requête confirme la fiche existante sans recréer",async()=>{
 const sql:string[]=[];
 const db={query:async(query:string)=>{
  sql.push(query);
  if(query.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:"team-1"}]};
  if(query.includes("SELECT r.id FROM public.smn_registry_item r")&&query.includes("FOR UPDATE OF r"))
   return {rows:[{id:sourceId}]};
  if(query.includes("ON CONFLICT DO NOTHING"))return {rows:[]};
  if(query.includes("FROM public.smn_registry_linked_request WHERE request_id="))
   return {rows:[{source_id:sourceId,actor_id:"actor-1",request_fingerprint:"MATCH",
    new_item_id:sourceId}]};
  return {rows:[]};
 }} as unknown as Client;
 // The actual fingerprint is verified separately; mismatching retries must not be replayed.
 const r=await createRegistryItem(db,"actor-1",{...base,sourceId},requestId);
 assert.equal(r.ok,false);
 if(r.ok)assert.fail("Expected conflict for a differing request");
 assert.equal(r.error,"conflict");
 assert.equal(sql.at(-1),"ROLLBACK");
 assert.ok(!sql.some(q=>q.includes("INSERT INTO public.smn_registry_item\n")));
});
test("AC2/AC5 : échec de l'audit provoque un rollback et ne confirme pas un succès",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:"team-1"}]};
  if(sql.includes("SELECT r.id FROM public.smn_registry_item r")&&sql.includes("FOR UPDATE OF r"))
   return {rows:[{id:sourceId}]};
  if(sql.includes("ON CONFLICT DO NOTHING"))return {rows:[{request_id:requestId}]};
  if(sql.includes("INSERT INTO public.smn_registry_relation_audit"))throw Error("db-audit-failure");
  return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>createRegistryItem(db,"actor-1",{...base,sourceId},requestId));
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.ok(!statements.includes("COMMIT"));
});
test("AC3 : origine d'une autre équipe bloque la transaction avant tout INSERT métier",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  return {rows:sql.includes("SELECT t.id FROM public.smn_team")?[{id:"team-1"}]:[]};
 }} as unknown as Client;
 const result=await createRegistryItem(db,"actor-1",{...base,sourceId},requestId);
 assert.deepEqual(result,{ok:false,error:"not-found"});
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.ok(!statements.some(sql=>sql.includes("INSERT INTO public.smn_registry_item\n")));
});
test("AC3/AC5 : la route liée refuse l'écriture user, et dérive l'origine de l'URL",()=>{
 const api=read("src/app/api/admin/registries/[id]/linked/route.ts");
 assert.match(api,/authorizeApi\(req,"write",\{type:"settings"/);
 assert.match(api,/parseLinkedJournalCreation/);
 assert.match(api,/createRegistryItem\(db,actor\.id,\{\.\.\.fields,sourceId:id\},requestId\)/);
 assert.match(api,/403/);
 assert.match(api,/409/);
 assert.match(api,/503/);
});
test("AC1/AC5 : modal de SMN-246 réutilisée, sélection limitée et POST dédié",()=>{
 const modal=read("src/app/app/admin/registries/registry-create-modal.tsx");
 assert.match(modal,/allowedTypes/);
 assert.match(modal,/linkedFromJournal/);
 assert.match(modal,/\/linked"/);
 assert.match(modal,/requestId/);
 assert.match(modal,/linkedJournalTypes/);
 assert.match(modal,/onCreated\(result\.id\)/);
 assert.ok(!modal.includes('setTitle("")'));
});
test("AC4 : dans le journal, choix des trois types et lien vers la fiche créée",()=>{
 const ui=read("src/app/app/admin/registries/registry-journal.tsx");
 for(const value of ["chooseLinked","linkedJournalTypes","RegistryCreateModal","linkedFromJournal",
  "teamId={teamId}","sourceId={itemId}","setLinkedCreated","registryDetailHref(linkedCreated.id,navigation)"])
  assert.ok(ui.includes(value),value);
 assert.match(ui,/refresh\(\)/);
 assert.match(ui,/setFilter\(type\)/);
});
test("AC4 : relations rafraîchies à la consultation et aucune mutation des données de Sprint",()=>{
 const detail=read("src/app/app/admin/registries/registry-detail.tsx");
 const summary=read("src/app/app/admin/registries/registry-summary.tsx");
 assert.match(summary,/teamId: string|teamId:string/);
 assert.match(summary,/<RegistryJournal/);
 assert.match(detail,/teamId=\{teamId\}/);
});
test("AC5 : le chemin de création décision/réunion existant reste disponible",()=>{
 const decision=read("src/app/app/admin/registries/decision-actions.tsx");
 const generic=read("src/app/api/admin/registries/route.ts");
 assert.match(decision,/\/create-action"/);
 assert.match(generic,/createRegistryItem/);
});
test("Accessibilité, i18n FR\/EN, cinq filtres conservés",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).registryJournal;
 const en=JSON.parse(read("src/i18n/en.json")).registryJournal;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of ["createLinked","chooseLinked","createdLinked","viewLinked",
  "createAnotherLinked","backToSource","action","decision","highlight"])assert.ok(fr[key]&&en[key],key);
 const css=read("src/app/globals.css");
 assert.match(css,/\.smn-registry-linked-chooser/);
 assert.match(css,/@media\(max-width:575px\)/);
});

test("AC2 : nouvelle émission identique reconnue sans nouvelle fiche ni doublon d'audit",async()=>{
 const {details,...fields}=base;
 const input=parseRegistryInput(fields);assert.ok(input);
 const parsed=parseInitialDetails(input.type,details,input.teamId);
 assert.equal(parsed.ok,true);
 if(!parsed.ok)assert.fail("Business details expected");
 const fingerprint=createHash("sha256").update(JSON.stringify({
  input,details:parsed.value,sourceId
 })).digest("hex");
 const calls:string[]=[];
 const db={query:async(sql:string)=>{
  calls.push(sql);
  if(sql.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:"team-1"}]};
  if(sql.includes("SELECT r.id FROM public.smn_registry_item r")&&sql.includes("FOR UPDATE OF r"))
   return {rows:[{id:sourceId}]};
  if(sql.includes("ON CONFLICT DO NOTHING"))return {rows:[]};
  if(sql.includes("FROM public.smn_registry_linked_request WHERE request_id="))
   return {rows:[{source_id:sourceId,actor_id:"actor-1",request_fingerprint:fingerprint,new_item_id:sourceId}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await createRegistryItem(db,"actor-1",{...base,sourceId},requestId);
 assert.equal(result.ok,true);
 if(!result.ok)assert.fail("Original creation should be replayed");
 assert.equal(result.id,sourceId);
 assert.equal(result.replayed,true);
 assert.equal(calls.at(-1),"ROLLBACK");
 assert.ok(!calls.some(sql=>sql.includes("INSERT INTO public.smn_registry_item\n")));
 assert.ok(!calls.some(sql=>sql.includes("INSERT INTO public.smn_registry_relation\n")));
});
test("AC4 : un journal lié prouve la création via la table de requêtes atomiques",()=>{
 const sql=read("src/server/registries/journal-links.ts");
 const model=read("src/lib/registry-journal.ts");
 const view=read("src/app/app/admin/registries/registry-journal.tsx");
 assert.ok(sql.includes("smn_registry_linked_request"));
 assert.ok(sql.includes("journal_origin.new_item_id=r.id"));
 assert.ok(sql.includes('AS "eventKind"'));
 assert.ok(model.includes('eventKind:"created"|"linked"'));
 assert.ok(view.includes('tr(entry.eventKind==="created"?"linkedCreatedEvent":"link")'));
});

test("AC4 : le journal ne confond pas une création initiale avec une relation recréée plus tard",()=>{
 const query=read("src/server/registries/journal-links.ts");
 assert.ok(query.includes("journal_origin.created_at=a.changed_at"));
 assert.ok(query.includes("audit.action='linked'"));
 assert.ok(query.includes("LEFT JOIN LATERAL (SELECT NULL::text AS new_item_id)"));
 const marker=query.indexOf("${createdJoin}",query.indexOf("const result=await db.query"));
 const audit=query.indexOf(") a ON true",query.indexOf("const result=await db.query"));
 assert.ok(marker>audit);
});
