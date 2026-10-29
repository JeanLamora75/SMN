import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readFileSync} from "node:fs";
import {parseAuditPage,changedFields,formatAuditValue,type AuditEvent} from "../src/lib/registry-audit-timeline";
import {readRegistryAuditTimeline} from "../src/server/registries/audit-timeline";
const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const id="11111111-1111-4111-8111-111111111111";
const auditId="22222222-2222-4222-8222-222222222222";
const at="2026-10-25 16:30:00+01";
const row:AuditEvent={id:auditId,kind:"record",revision:2,at,actorName:"admin",
 action:"updated",before:{title:"Avant",status:"open",description:null,revision:1},
 after:{title:"Après",status:"open",description:null,revision:2}};

test("AC2 : différences uniquement réellement modifiées, null conservé",()=>{
 const diff=changedFields(row);
 assert.deepEqual(diff,[{key:"title",before:"Avant",after:"Après"}]);
 const removal=changedFields({...row,before:{description:"texte"},after:{description:null}});
 assert.deepEqual(removal,[{key:"description",before:"texte",after:null}]);
});
test("AC2 : création : valeurs connues seulement, jamais champs inventés",()=>{
 const fields=changedFields({...row,revision:1,action:"created",before:null,
  after:{title:"Nouvelle",status:"open",owner:null,unknown:"hidden"}});
 assert.deepEqual(fields,[{key:"title",before:null,after:"Nouvelle"},
  {key:"status",before:null,after:"open"}]);
});
test("AC2/3 : audit commentaire corrigé et retiré seulement, sans inventer d'édition",()=>{
 const edited=changedFields({...row,kind:"comment",action:"edited",
  before:{text:"Original"},after:{text:"Corrigé"}});
 assert.deepEqual(edited,[{key:"text",before:"Original",after:"Corrigé"}]);
 const withdrawn=changedFields({...row,kind:"comment",action:"withdrawn",
  before:{text:"Original"},after:{text:null}});
 assert.equal(withdrawn.length,1);
 assert.equal(withdrawn[0].after,null);
});
test("AC2/4 : ne jamais afficher UUID ou JSON brut pour les parties",()=>{
 assert.equal(formatAuditValue({kind:"external",name:"Équipe partenaire"}),"Équipe partenaire");
 assert.equal(formatAuditValue({kind:"local",teamId:id}),"local");
 assert.equal(formatAuditValue({teamId:id}),null);
});
test("AC1/4 : payload refuse un faux acteur, une fausse date et un faux genre",()=>{
 assert.equal(parseAuditPage({events:[{...row,at:"invalid"}],hasMore:false,page:1}),null);
 assert.equal(parseAuditPage({events:[{...row,kind:"imaginary"}],hasMore:false,page:1}),null);
 assert.equal(parseAuditPage({events:[{...row,actorName:id}],hasMore:false,page:1})?.events[0].actorName,null);
 assert.ok(parseAuditPage({events:[{...row,actorName:null}],hasMore:false,page:1}));
});
test("AC6 : pagination bornée et ordonnée, 26e entrée comme indice hasMore",async()=>{
 const queried:{sql:string;args?:unknown[]}[]=[];
 const db={query:async(sql:string,args?:unknown[])=>{
  queried.push({sql,args});
  if(sql.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id}]};
  if(sql.includes("to_regclass"))return {rows:[{record:true,assessment:false,roam:false,
   parties:false,vigilance:false,decision:false,comments:false,
   relations:false,cycles:false,actions:false}]};
  if(sql.includes("UNION ALL")||sql.includes("ORDER BY event_at DESC"))
   return {rows:Array.from({length:26},(_,i)=>({...row,id:i.toString().padStart(36,"0")}))};
  return {rows:[]};
 }} as unknown as Client;
 const result=await readRegistryAuditTimeline(db,id,2);
 assert.equal(result?.events.length,25);
 assert.equal(result?.hasMore,true);
 assert.equal(result?.page,2);
 const q=queried.at(-1)!;
 assert.match(q.sql,/ORDER BY event_at DESC,id DESC/);
 assert.deepEqual(q.args,[id,26,25]);
 assert.ok(!queried.some(x=>/CREATE TABLE|UPDATE public|INSERT INTO|DELETE FROM/.test(x.sql)));
});
test("AC3 : unions uniquement sur tables d'audit réellement installées",async()=>{
 const sql:string[]=[];
 const db={query:async(query:string)=>{
  sql.push(query);
  if(query.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id}]};
  if(query.includes("to_regclass"))return {rows:[{record:true,assessment:false,roam:false,
   parties:false,vigilance:false,decision:false,comments:false,
   relations:false,cycles:false,actions:false}]};
  return {rows:[]};
 }} as unknown as Client;
 await readRegistryAuditTimeline(db,id,1);
 const union=sql.at(-1)!;
 assert.ok(union.includes("smn_registry_item_audit"));
 for(const name of ["smn_risk_roam_audit","smn_registry_relation_audit",
  "smn_registry_cycle_link_audit","smn_registry_comment_revision"])
  assert.ok(!union.includes(name),name);
});
test("AC3 : quand tous les audits existent, commentaire, relation, cycle et métier sont couverts",async()=>{
 const sql:string[]=[];
 const db={query:async(query:string)=>{
  sql.push(query);
  if(query.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id}]};
  if(query.includes("to_regclass"))return {rows:[{record:true,assessment:true,roam:true,
   parties:true,vigilance:true,decision:true,comments:true,
   relations:true,cycles:true,actions:true}]};
  return {rows:[]};
 }} as unknown as Client;
 await readRegistryAuditTimeline(db,id,1);
 const query=sql.at(-1)!;
 for(const name of ["smn_risk_assessment_audit","smn_risk_roam_audit",
  "smn_dependency_parties_audit","smn_dependency_vigilance_audit",
  "smn_decision_detail_audit","smn_registry_comment_revision",
  "smn_registry_relation_audit","smn_registry_cycle_link_audit",
  "smn_action_link_audit"])assert.ok(query.includes(name),name);
 assert.ok(query.includes("LEFT JOIN public.smn_account"));
});
test("AC5 : route historiquement réservée au droit audit",()=>{
 const route=file("src/app/api/admin/registries/[id]/history/route.ts");
 const page=file("src/app/app/admin/registries/registry-detail.tsx");
 assert.match(route,/authorizeApi\(req,"read",\{type:"audit"/);
 assert.match(route,/withLegacyRegistryReadDb/);
 assert.match(page,/historyRestricted/);
 assert.match(page,/<RegistryHistory key=\{id\} id=\{id\}/);
});
test("AC6 : UI chrono avec details natifs, bouton plus et nom neutre",()=>{
 const ui=file("src/app/app/admin/registries/registry-history.tsx");
 assert.ok(ui.includes("<details"));
 assert.ok(ui.includes('tr("unknownAuthor")'));
 assert.ok(ui.includes('tr("loadMore")'));
 assert.ok(ui.includes("changedFields("));
 assert.ok(ui.includes('timeZone:"Europe/Paris"'));
 assert.ok(ui.includes("role=\"alert\""));
 assert.ok(!ui.includes("actorId??"));
});
test("AC6 : aucun UUID dans la réponse et pas de valeurs projetées",()=>{
 const reader=file("src/server/registries/audit-timeline.ts");
 assert.ok(reader.includes('u.username AS "actorName"'));
 assert.ok(reader.includes("NULL::jsonb"));
 assert.ok(!reader.includes('actor_id AS "actorId"'));
 assert.ok(!reader.includes("CREATE TABLE IF NOT EXISTS"));
});
test("AC6 : traductions français/anglais strictement symétriques",()=>{
 const fr=JSON.parse(file("src/i18n/fr.json")).registryAudit;
 const en=JSON.parse(file("src/i18n/en.json")).registryAudit;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of ["history","created","updated","comment","withdrawn",
  "linked","unlinked","unknownAuthor","before","after","empty","loadMore",
  "unavailable","retry","noChanges","yes","no"])assert.ok(fr[key]&&en[key],key);
});

test("AC6 : aucune révision = historique vide vérifié, non un succès fabriqué",async()=>{
 const db={query:async(sql:string)=>{
  if(sql.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id}]};
  if(sql.includes("to_regclass"))return {rows:[{
   record:true,assessment:false,roam:false,parties:false,vigilance:false,
   decision:false,comments:false,relations:false,cycles:false,actions:false
  }]};
  return {rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await readRegistryAuditTimeline(db,id,1),{events:[],page:1,hasMore:false});
});
test("AC6 : installation sans source centrale signale une indisponibilité",async()=>{
 const db={query:async(sql:string)=>{
  if(sql.includes("SELECT r.id FROM public.smn_registry_item"))return {rows:[{id}]};
  return {rows:[{record:false}]};
 }} as unknown as Client;
 await assert.rejects(()=>readRegistryAuditTimeline(db,id,1),/record-audit-not-installed/);
});
test("AC6 : hors équipe ou fiche inexistante, le lecteur ne consulte aucun audit",async()=>{
 const queried:string[]=[];
 const db={query:async(sql:string)=>{queried.push(sql);return {rows:[]};}} as unknown as Client;
 assert.equal(await readRegistryAuditTimeline(db,id,1),null);
 assert.equal(queried.length,1);
 assert.ok(queried[0].includes("i.id='singleton'"));
});
test("AC6 : numéros de pages invalides bloqués avant toute requête SQL",async()=>{
 const db={query:async()=>{throw Error("unexpected SQL");}} as unknown as Client;
 for(const page of [0,-1,1.5,10001,Number.NaN])
  assert.equal(await readRegistryAuditTimeline(db,id,page),null);
});
test("AC3 : les noms d'auteurs absents restent neutres même si les audits contiennent une action",()=>{
 const event={...row,actorName:null,kind:"relation",action:"unlinked",
  before:{target:"Action liée"},after:null};
 const parsed=parseAuditPage({events:[event],page:1,hasMore:false});
 assert.ok(parsed);
 assert.equal(parsed.events[0].actorName,null);
 assert.deepEqual(changedFields(parsed.events[0]),[{key:"target",before:"Action liée",after:null}]);
});
