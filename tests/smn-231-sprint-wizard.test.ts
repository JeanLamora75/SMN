import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {parseWizardInput,previewWizard,WizardPreviewFailure} from "../src/server/sprints/wizard";
import type {Client} from "pg";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const request=(count:number,extra:Record<string,unknown>={})=>({
 startOn:"2026-11-02",count,generateHistoricalCeremonies:false,...extra
});
const server=read("src/server/sprints/wizard.ts");
const client=read("src/app/app/admin/sprints/sprint-generation-wizard.tsx");
const previewRoute=read("src/app/api/admin/sprints/wizard/preview/route.ts");
const confirmRoute=read("src/app/api/admin/sprints/wizard/confirm/route.ts");

describe("SMN-231 — assistant de génération unitaire et par lot",()=>{
 it("accepte les quantités 1 à 6 et l'option historique explicite désactivée",()=>{
  for(let n=1;n<=6;n++)assert.deepEqual(parseWizardInput(request(n)),request(n));
 });
 it("accepte exactement un nom non vide par sprint et élimine les espaces",()=>{
  const input=request(3,{names:[" Sprint 1 ","Sprint 2","Sprint 3"]});
  assert.deepEqual(parseWizardInput(input)?.names,["Sprint 1","Sprint 2","Sprint 3"]);
  assert.equal(parseWizardInput(request(2,{names:["A"]})),null);
  assert.equal(parseWizardInput(request(2,{names:["A",""]})),null);
  assert.equal(parseWizardInput(request(1,{names:["a".repeat(161)]})),null);
 });
 it("refuse les mauvaises dates, les options implicites et les champs non reconnus",()=>{
  for(const input of [
   request(0),request(7),request(1.5),request(1,{generateHistoricalCeremonies:"true"}),
   request(1,{startOn:"2026-02-30"}),request(1,{startOn:"yesterday"}),
   request(1,{unknown:true}),{startOn:"2026-11-02",count:1},
   request(2,{names:["A",5]}),null,[request(1)]
  ])assert.equal(parseWizardInput(input),null,JSON.stringify(input));
 });
 it("n'utilise pas le contrat batch limité à 2–6 pour émettre un jeton unitaire",()=>{
  assert.match(server,/smn_sprint_wizard_preview/);
  assert.match(server,/count\s*:\s*input\.count/);
  assert.doesNotMatch(server,/raw\.count<2|count BETWEEN 2 AND 6/);
  assert.match(server,/previewSprintBatch\(db,\{startOn:input\.startOn,count:input\.count\},teamId\)/);
 });
 it("n'enregistre aucun sprint lors de l'aperçu, uniquement un jeton à durée limitée",()=>{
  const segment=server.slice(server.indexOf("export async function previewWizard("),
   server.indexOf("export async function confirmWizard("));
  assert.match(segment,/now\(\)\+interval '10 minutes'/);
  assert.match(segment,/if\(token\)/);
  assert.doesNotMatch(segment,/INSERT INTO public\.smn_sprint\s/);
  assert.match(segment,/activeTemplates/);
  assert.match(segment,/settings/);
 });
 it("verrouille le jeton, le propriétaire et l'équipe avant toute création",()=>{
  assert.match(server,/consumed_at IS NULL AND expires_at>now\(\) FOR UPDATE/);
  assert.match(server,/saved\.actor_id!==actorId/);
  assert.match(server,/pg_advisory_xact_lock/);
  assert.match(server,/LOCK TABLE public.smn_scrum_cadence/);
  assert.match(server,/stale-preview/);
  assert.match(server,/hash\(preview,settings,input\.generateHistoricalCeremonies\)!==saved\.digest/);
 });
 it("revalide conflits et empreinte avant d'écrire, et ne valide qu'une transaction entière",()=>{
  const confirm=server.slice(server.indexOf("export async function confirmWizard("));
  const previewPosition=confirm.indexOf("previewSprintBatch(");
  const hashPosition=confirm.indexOf("hash(preview,settings,input.generateHistoricalCeremonies)!==saved.digest");
  const insertPosition=confirm.search(/INSERT INTO public\.smn_sprint\s*\(/);
  assert.ok(previewPosition>=0,"La revalidation des périodes doit être présente");
  assert.ok(hashPosition>=0,"La revalidation de l'empreinte doit être présente");
  assert.ok(insertPosition>=0,"L'insertion SQL du sprint doit être présente");
  assert.ok(previewPosition<hashPosition,"Les périodes doivent être validées avant l'empreinte");
  assert.ok(hashPosition<insertPosition,"L'empreinte doit être validée avant toute insertion");
  assert.match(confirm,/await db\.query\("BEGIN"\)/);
  assert.match(confirm,/await db\.query\("COMMIT"\)/);
  assert.match(confirm,/await db\.query\("ROLLBACK"\)/);
  assert.match(confirm,/smn_sprint_batch_audit/);
  assert.match(confirm,/SET consumed_at=now\(\)/);
 });
 it("identifie une erreur PostgreSQL de schéma avec son code sans fuite de paramètres",async()=>{
  const fake={query:async()=>{throw Object.assign(new Error("table absente"),{code:"42P01"});}} as unknown as Client;
  await assert.rejects(()=>previewWizard(fake,"actor-1",request(2)),error=>{
   assert.ok(error instanceof WizardPreviewFailure);
   assert.equal(error.stage,"schema");
   assert.equal(error.sqlState,"42P01");
   assert.equal(error.message,"wizard-preview-unavailable");
   return true;
  });
 });
 it("distingue une erreur du calcul des périodes d'un défaut de schéma",async()=>{
  const fake={query:async(sql:string)=>{
   if(sql.includes("array_agg(relname)")||sql.includes("array_agg(c.relname)"))return {rows:[{present:["smn_scrum_cadence","smn_scrum_cadence_audit","smn_sprint_batch_preview","smn_sprint_batch_audit","smn_scrum_ceremony_template","smn_scrum_ceremony_template_history","smn_scrum_lunch"]}]};
   if(sql.includes("SELECT t.id FROM public.smn_team t")||sql.includes("FROM public.smn_team t"))throw Error("équipe inaccessible");
   return {rows:[],rowCount:0};
  }} as unknown as Client;
  await assert.rejects(()=>previewWizard(fake,"actor-1",request(2)),error=>{
   assert.ok(error instanceof WizardPreviewFailure);
   assert.equal(error.stage,"team");
   assert.equal(error.sqlState,null);
   return true;
  });
 });
 it("transmet une phase et un code sûrs au client sans renvoyer l'erreur SQL brute",()=>{
  assert.match(previewRoute,/error instanceof WizardPreviewFailure/);
  assert.match(previewRoute,/stage,diagnosticCode:sqlState\?\?"SERVER"/);
  assert.match(previewRoute,/console\.error\("sprint-wizard-preview-failed"/);
  assert.doesNotMatch(previewRoute,/message:root\.message.*jsonResult/);
  assert.match(client,/sprintWizard\.previewFailureStage/);
  assert.match(client,/previewStageLabels/);
 });
 it("affiche les étapes une seule fois sans double numérotation",()=>{
  assert.match(client,/list-unstyled d-flex gap-3/);
  assert.match(client,/\{i\+1\}<\/span>/);
  for(const locale of ["fr","en"]){
   const j=JSON.parse(read("src/i18n/"+locale+".json")).sprintWizard;
   for(const label of ["configure","preview","confirm"])
    assert.doesNotMatch(j[label],/^\d+[.)]\s/);
   for(const key of ["previewFailureStage","stageSchema","stagePeriods","stageSettings","schemaUnavailable","previewTimeout"])
    assert.ok(j[key],locale+"."+key);
  }
 });
 it("sécurise les deux endpoints en écriture administrateur",()=>{
  for(const route of [previewRoute,confirmRoute]){
   assert.match(route,/authorizeApi\(request,"write",\{type:"settings",exists:true,inScope:true\}\)/);
   assert.match(route,/withAuthDb\(/);
   assert.match(route,/forbidden/);
   assert.match(route,/403/);
  }
 });
 it("préserve les API historiques et le chemin transitoire",()=>{
  for(const path of [
   "src/app/api/admin/sprints/route.ts",
   "src/app/api/admin/sprints/preview/route.ts",
   "src/app/api/admin/sprints/batch/route.ts"
  ])assert.match(read(path),/authorizeApi\(/);
  const legacy=read("src/app/app/admin/sprints/tools/page.tsx");
  assert.match(legacy,/<SprintForm\/>/);
  assert.match(legacy,/<BatchPreviewForm\/>/);
 });
 it("dispose d'une page dédiée protégée et d'un unique CTA sur la liste",()=>{
  const page=read("src/app/app/admin/sprints/generate/page.tsx");
  const index=read("src/app/app/admin/sprints/sprint-index-view.tsx");
  assert.match(page,/canAccess\(account,"write",\{type:"settings"/);
  assert.match(page,/lower\(mode\)='scrum'/);
  assert.match(page,/<SprintGenerationWizard\/>/);
  assert.equal(index.split('href={generateHref}').length-1,2);
  assert.ok(index.includes('const generateHref="/app/admin/sprints/generate?"'));
  assert.doesNotMatch(index,/href="\/app\/admin\/sprints\/tools#create-sprints"/);
 });
 it("présente les trois étapes sans fabriquer de clic vers une fiche inexistante",()=>{
  for(const fragment of [
   'setStep(1)','setStep(2)','setStep(3)','fetchPreview(','onClick={()=>void confirm()}',
   'onClick={()=>void fetchPreview()}','setNames(','sprintWizard.historicalOption'
  ])assert.ok(client.includes(fragment),fragment);
  assert.doesNotMatch(client,/href="#"/);
  assert.match(client,/useUnsavedChanges/);
  assert.match(client,/event\.key==="Escape"/);
 });
 it("annule le jeton dès que le nom ou le choix historique change",()=>{
  assert.match(client,/const invalidate=\(\)=>\{setToken\(null\)/);
  assert.match(client,/updateName\(i,event\.target\.value\)/);
  assert.match(client,/updateHistorical\(event\.target\.checked\)/);
  assert.match(client,/sprintWizard\.duplicateName/);
  assert.match(client,/!token\|\|!snapshotMatches/);
 });
 it("supprime les cérémonies d'une reprise historique par défaut, sans affecter le futur",()=>{
  assert.match(server,/new Date\(item\.startAt\)\.getTime\(\)<Date\.now\(\)/);
  assert.match(server,/const generate=!historical\|\|input\.generateHistoricalCeremonies/);
  assert.match(server,/if\(generate\)await saveGeneratedCeremonies/);
  assert.match(server,/reconstructed:historical/);
 });
 it("enregistre la provenance reconstituée, sans inventer un statut de réunion tenue",()=>{
  const standard=read("src/server/sprints/ceremonies.ts");
  const templates=read("src/server/sprints/template-occurrences.ts");
  assert.match(read("scripts/apply-ceremony-schema-v32.ts"),/generation_source/);
  assert.match(standard,/return saveTemplateOccurrences\(db,sprint,/);
  assert.doesNotMatch(standard,/INSERT INTO public\.smn_sprint_ceremony\s*\(/);
  assert.match(templates,/generation_source/);
  assert.match(templates,/options\.reconstructed\?"reconstructed":"standard"/);
  assert.doesNotMatch(server,/status:'held'|status:"held"/);
  assert.match(server,/settingsSnapshot:settings/);
 });
 it("signale la reconstruction dans les vues calendrier et détails",()=>{
  const api=read("src/app/api/team-calendar/meetings/route.ts");
  const view=read("src/app/app/team-calendar/team-calendar-view.tsx");
  const detail=read("src/app/app/team-calendar/meeting/[kind]/[id]/page.tsx");
  assert.match(api,/generationSource:m\.generation_source/);
  assert.match(view,/CalendarOptionB/);
  assert.match(detail,/generation_source==="reconstructed"/);
 });
 it("préserve recherche, filtres, tri et page au retour de la génération",()=>{
  const page=read("src/app/app/admin/sprints/page.tsx");
  const index=read("src/app/app/admin/sprints/sprint-index-view.tsx");
  assert.match(page,/parseSprintIndexQuery\(qs\)/);
  assert.match(page,/initialFilters=\{initialFilters\}/);
  assert.match(index,/new URLSearchParams\(\{search,status:filter,sort,page:String\(page\)\}\)/);
  assert.match(index,/initialFilters\?\.page\?\?1/);
  assert.match(client,/router\.push\(listHref\(\)\)/);
 });
 it("conserve les libellés exhaustifs FR/EN",()=>{
  const fr=JSON.parse(read("src/i18n/fr.json")).sprintWizard;
  const en=JSON.parse(read("src/i18n/en.json")).sprintWizard;
  assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
  for(const key of Object.keys(fr)){
   assert.ok(typeof fr[key]==="string"&&fr[key].length>0);
   assert.ok(typeof en[key]==="string"&&en[key].length>0);
  }
 });
});
