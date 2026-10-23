import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const detail=read("src/app/app/admin/members/[id]/member-detail.tsx");
const list=read("src/app/app/admin/members/[id]/member-absence-summary.tsx");
const editor=read("src/app/app/admin/members/member-absence-editor.tsx");
const domain=read("src/server/members/absence.ts");
const route=read("src/app/api/admin/members/[id]/absences/route.ts");
const capacity=read("src/server/capacity/engine.ts");
const team=read("src/server/members/team-calendar.ts");

describe("Fiche membre V2 — onglet Absences et calculs affectés",()=>{
 it("affiche la liste dans l'onglet et ouvre une modale dédiée sans formulaire inline",()=>{
  const start=detail.indexOf('tab==="absences"'),end=detail.indexOf('tab==="history"',start);
  assert.ok(start>=0&&end>start);
  const tab=detail.slice(start,end);
  assert.match(tab,/<MemberAbsenceSummary/);
  assert.match(tab,/onCreate=\{\(\)=>/);
  assert.match(tab,/onEdit=\{absence=>/);
  assert.doesNotMatch(tab,/<MemberAbsenceEditor/);
  assert.match(detail,/section==="absence"&&<MemberAbsenceEditor/);
  assert.match(detail,/record=\{absenceToEdit\}/);
 });
 it("place Ajouter une absence en première ligne avant l'historique",()=>{
  assert.ok(list.indexOf('memberAbsences.add')<list.indexOf('member-absence-upcoming'));
  assert.ok(list.indexOf('memberAbsences.add')<list.indexOf('member-absence-past'));
  assert.match(list,/onClick=\{onCreate\}/);
 });
 it("classe par dates décroissantes et distingue passé et à venir selon la date de Paris",()=>{
  assert.match(list,/b\.startOn\.localeCompare\(a\.startOn\)/);
  assert.match(list,/b\.endOn\.localeCompare\(a\.endOn\)/);
  assert.match(list,/record\.endOn>=data\.today/);
  assert.match(list,/record\.endOn<data\.today/);
  assert.match(route,/timeZone:"Europe\/Paris"/);
  assert.match(list,/memberAbsences\.noneUpcoming/);
  assert.match(list,/memberAbsences\.nonePast/);
 });
 it("affiche les champs historiques et les actions sur chaque absence non supprimée",()=>{
  for(const part of ["record.startOn","record.endOn","record.categoryName","record.reason",
   "record.startSlot","record.endSlot","record.isPlanned","record.deleted"]){
   assert.ok(list.includes(part),part);
  }
  assert.match(list,/onEdit\(record\)/);
  assert.match(list,/void remove\(record\)/);
  assert.match(list,/data!\.archived\|\|record\.deleted/);
 });
 it("avertit sans interdire l'édition rétroactive et confirme la suppression",()=>{
  assert.match(editor,/record&&record\.startOn<today/);
  assert.match(editor,/memberAbsences\.pastWarning/);
  assert.match(list,/const past=record\.startOn<data\.today/);
  assert.match(list,/window\.confirm\(confirmText\)/);
  assert.match(editor,/onSubmit=\{submit\}/);
  assert.match(list,/action:"delete",id:record\.id,revision:record\.revision/);
 });
 it("ne propose dans la modale que la création ou correction, sans historique ni suppression",()=>{
  assert.match(editor,/members\.absence\.newTitle/);
  assert.match(editor,/members\.absence\.editTitle/);
  assert.doesNotMatch(editor,/<table|<thead|<tbody|MemberCalendarEditor|MemberAbsenceSummary/);
  assert.doesNotMatch(editor,/members\.absence\.historyTitle|regionalAbsence\.dayReview/);
  assert.doesNotMatch(editor,/action:"delete"/);
  assert.match(editor,/onSaved\(\)/);
 });
 it("conserve les suppressions auditables et les écarte de toutes les disponibilités courantes",()=>{
  assert.match(domain,/JSON\.stringify\(\{\.\.\.before,deleted:true\}\)/);
  assert.match(domain,/WHERE a\.member_id=\$1 ORDER BY a\.start_on DESC/);
  assert.match(domain,/if\(a\.deleted\)return false/);
  assert.match(domain,/if\(old\?\.deleted\)return fail\("not-found"\)/);
  assert.match(domain,/after_values->>'deleted'='true'/);
  assert.match(capacity,/after_values->>'deleted'='true'/);
  assert.match(team,/after_values->>'deleted'='true'/);
  assert.match(route,/data\.absences\.filter\(absence=>!absence\.deleted\)/);
 });
 it("rafraîchit les vues de capacité à la demande sans altérer les snapshots initiaux ou clos",()=>{
  assert.match(route,/revalidatePath\("\/app\/admin\/development-capacity"\)/);
  assert.match(route,/revalidatePath\("\/app\/team-calendar"\)/);
  assert.match(route,/capacityRefresh:"on-demand"/);
  assert.doesNotMatch(domain,/UPDATE public\.smn_capacity_|DELETE FROM public\.smn_capacity_/);
  assert.match(detail,/setAbsenceRefreshKey\(current=>current\+1\)/);
  assert.match(detail,/key=\{member\.id\+"-"\+absenceRefreshKey\}/);
 });
 it("conserve toutes les traductions nécessaires dans les deux langues",()=>{
  const fr=JSON.parse(read("src/i18n/fr.json")).memberAbsences;
  const en=JSON.parse(read("src/i18n/en.json")).memberAbsences;
  assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
  for(const k of Object.keys(fr)){
   assert.ok(fr[k]?.trim(),k);
   assert.ok(en[k]?.trim(),k);
  }
 });
});
