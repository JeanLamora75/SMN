import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {settingsCatalog} from "../src/lib/settings-catalog";
import {canAccess} from "../src/server/access-policy";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const entries=(mode:"scrum"|"kanban")=>settingsCatalog(mode,admin).flatMap(group=>group.entries);

describe("SMN-229 — paramètres partagés séparés des sprints",()=>{
 it("raccorde les deux rubriques aux routes réelles pour Scrum, sans activer une fausse règle",()=>{
  const scrum=entries("scrum");
  assert.equal(scrum.find(x=>x.id==="workingDays")?.href,"/app/admin/settings/working-days");
  assert.equal(scrum.find(x=>x.id==="workingDays")?.status,"partial");
  assert.equal(scrum.find(x=>x.id==="ceremonies")?.href,"/app/admin/settings/ceremonies");
  assert.equal(scrum.find(x=>x.id==="ceremonies")?.status,"partial");
  assert.equal(scrum.find(x=>x.id==="capacity")?.href,null);
  assert.equal(scrum.find(x=>x.id==="cadence")?.href,"/app/admin/scrum-cadence");
 });
 it("refuse les paramètres Scrum dans Kanban et pour les utilisateurs sans droits",()=>{
  for(const id of ["workingDays","ceremonies"]){
   assert.equal(entries("kanban").find(x=>x.id===id)?.href,null,id);
   assert.equal(entries("kanban").find(x=>x.id===id)?.status,"not-applicable",id);
  }
  assert.equal(entries("kanban").find(x=>x.id==="cadence")?.href,"/app/admin/kanban-cadence");
  assert.equal(settingsCatalog("scrum",user).flatMap(g=>g.entries).length,0);
  assert.equal(canAccess(user,"write",{type:"settings",exists:true,inScope:true}),false);
 });
 it("retire seulement les réglages partagés de Sprints et garde les autres parcours",()=>{
  const code=read("src/app/app/admin/sprints/tools/page.tsx");
  for(const removed of ["WorkSlotsForm","LunchForm","TemplateForm"]){
   assert.ok(!code.includes("<"+removed),removed);
   assert.ok(!code.includes('import '+removed+' '),removed);
  }
  for(const required of [
   "<SprintForm/>","<BatchPreviewForm/>","<SprintStateList/>",
   "<RenameSprintForm/>","<DeleteSprintForm/>","<RescheduleForm/>",
   "<CeremonyEditor/>","<TemplateOccurrencesList/>","<ExceptionalMeetingForm/>",
   "<AttendanceForm/>","<ActualDurationForm/>","<ExceptionalCapacityForm/>",
   "<SprintReviewLink/>"
  ])assert.ok(code.includes(required),required);
  for(const dest of [
   "/app/admin/settings/working-days",
   "/app/admin/settings/ceremonies",
   "/app/admin/scrum-cadence"
  ])assert.ok(code.includes('href="'+dest+'"'),dest);
 });
 it("la page Jours ouvrés réutilise les créneaux, fuseau et pause sans éditer la semaine",()=>{
  const file=read("src/app/app/admin/settings/working-days/page.tsx");
  assert.match(file,/<WorkSlotsForm\/>/);
  assert.match(file,/<LunchForm\/>/);
  assert.match(file,/settingsSprint\.workingDaysScope/);
  assert.doesNotMatch(file,/<WeekdayForm|<WorkWeekForm|<CalendarEditor/);
  assert.match(file,/href="\/app\/admin\/settings"/);
 });
 it("la page Cérémonies réutilise exclusivement les modèles sans modifier d'occurrences",()=>{
  const file=read("src/app/app/admin/settings/ceremonies/page.tsx");
  assert.match(file,/<TemplateForm\/>/);
  assert.match(file,/settingsSprint\.ceremoniesScope/);
  assert.doesNotMatch(file,/<CeremonyEditor|<TemplateOccurrencesList|<ExceptionalMeetingForm/);
  assert.match(file,/href="\/app\/admin\/settings"/);
 });
 it("les pages appliquent les mêmes protections serveur que les paramètres existants",()=>{
  for(const page of ["working-days","ceremonies"]){
   const code=read("src/app/app/admin/settings/"+page+"/page.tsx");
   assert.match(code,/currentAccount\(\)/);
   assert.match(code,/redirect\("\/login"\)/);
   assert.match(code,/must_change_password/);
   assert.match(code,/canAccess\(account,"read",\{type:"settings"/);
   assert.match(code,/lower\(mode\)='scrum'/);
   assert.match(code,/redirect\("\/app\/admin\/settings"\)/);
  }
 });
 it("préserve les API et le contrôle de révision sans duplication de modèle",()=>{
  for(const [path,methods] of [
   ["work-slots",["GET","PUT"]],
   ["lunch",["GET","PATCH"]],
   ["templates",["GET","POST"]]
  ] as const){
   const api=read("src/app/api/admin/sprints/"+path+"/route.ts");
   for(const method of methods)assert.match(api,new RegExp("export async function "+method+"\\("));
   assert.match(api,/authorizeApi\(/);
   assert.match(api,/withAuthDb\(|withLegacyTeamApi\(/);
  }
  assert.match(read("src/server/sprints/work-slot-config.ts"),/revision/);
  assert.match(read("src/server/sprints/lunch.ts"),/revision/);
  assert.match(read("src/server/sprints/ceremony-templates.ts"),/template_history/);
 });
 it("aucune mutation de cycles, d'occurrences ou d'instantanés historiques dans les pages",()=>{
  const concatenated=["working-days","ceremonies"].map(p=>read("src/app/app/admin/settings/"+p+"/page.tsx")).join("\n");
  assert.doesNotMatch(concatenated,/UPDATE public\.smn_sprint|DELETE FROM|ALTER TABLE|smn_capacity_initial_snapshot/);
  assert.match(read("src/server/sprints/template-occurrences.ts"),/template_revision/);
 });
 it("les textes et les limites de configuration sont traduits en FR et EN",()=>{
  for(const locale of ["fr","en"]){
   const j=JSON.parse(read("src/i18n/"+locale+".json"));
   for(const k of ["workingDaysScope","ceremoniesScope","workingDaysTitle","ceremoniesTitle"]){
    assert.ok(typeof j.settingsSprint[k]==="string"&&j.settingsSprint[k].length>0,locale+" "+k);
   }
   assert.ok(j.settingsCatalog.items.workingDays.description);
   assert.ok(j.settingsCatalog.items.ceremonies.description);
  }
 });
});
