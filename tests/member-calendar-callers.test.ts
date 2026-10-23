import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";

const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const calendar=file("src/app/app/admin/members/member-calendar-editor.tsx");
const quick=file("src/app/app/admin/members/quick-members-admin.tsx");
const detail=file("src/app/app/admin/members/[id]/member-detail.tsx");

describe("SMN — intégration du nouvel éditeur de calendrier individuel",()=>{
 it("exige deux callbacks distincts pour la sauvegarde et l'annulation",()=>{
  assert.match(calendar,/onSaved:\(\)=>void;onCancel:\(\)=>void/);
  assert.doesNotMatch(calendar,/onClose:\(\)=>void/);
 });
 it("met à jour l'écran historique d'administration des membres",()=>{
  assert.match(quick,/<MemberCalendarEditor[\s\S]*?onSaved=\{savedCalendar\}/);
  assert.match(quick,/<MemberCalendarEditor[\s\S]*?onCancel=\{\(\)=>setCalendarId\(null\)\}/);
  assert.doesNotMatch(quick,/teamName=\{roster!\.team\.name\} onClose=/);
 });
 it("rafraîchit la liste seulement après un succès dans cet écran",()=>{
  assert.match(quick,/const savedCalendar=\(\)=>\{[\s\S]*?setCalendarId\(null\);[\s\S]*?void refresh\(\)/);
  assert.match(quick,/setMessage\(t\("members\.calendar\.weekSaved"\)\)/);
  assert.match(quick,/onCancel=\{\(\)=>setCalendarId\(null\)\}/);
 });
 it("conserve le contrat de la fiche membre V2",()=>{
  assert.match(detail,/<MemberCalendarEditor[^>]*onSaved=\{saved\} onCancel=\{\(\)=>setSection\(null\)\}/s);
  assert.doesNotMatch(detail,/<MemberCalendarEditor[^>]*onClose=/s);
 });
});
