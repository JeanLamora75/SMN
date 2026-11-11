import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
describe("Dashboard — édition modale des registres et notes",()=>{
 const list=read("src/app/app/dashboard-builder/dashboard-business-list.tsx");
 const consultation=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 const edit=read("src/app/app/dashboard-builder/dashboard-record-editor.tsx");
 it("ouvre une modale pour risque obstacle dépendance et note",()=>{
  for(const kind of ["risk","obstacle","dependency","note","ceremony","template","exceptional"])assert.ok(list.includes('"'+kind+'"'));
  assert.match(list,/onClick=\{\(\)=>onEdit\(item\)\}/);
  assert.match(consultation,/<DashboardRecordEditor/);
  assert.match(edit,/<RegistryEditModal/);
  assert.match(edit,/<RegistrySectionDialog/);
  assert.match(edit,/<CalendarMeetingModal/);
 });
 it("charge les styles ROAM et matrice de criticité hors des pages registres",()=>{
  const css=read("src/app/app/admin/registries/registry-cockpit.css");
  assert.match(edit,/import "\.\.\/admin\/registries\/registry-cockpit\.css"/);
  for(const selector of [".smn-risk-roam-grid",".smn-risk-roam-tile",".smn-risk-matrix",".smn-risk-matrix-cell"])
   assert.ok(css.includes(selector),selector);
 });
 it("respecte les permissions et ne modifie pas un cycle clôturé",()=>{
  assert.match(consultation,/canManage&&!personalizing&&navigation\.current\?\.status!=="closed"/);
  assert.match(edit,/method:"PATCH"/);
  assert.match(edit,/expectedBody:note\.body,expectedStatus:note\.status/);
  assert.match(edit,/teamId,sprintId:entry\.cycleId/);
 });
 it("rafraîchit les listes à l'enregistrement et conserve les liens hors édition",()=>{
  assert.match(consultation,/onSaved=\{\(\)=>\{setEditing\(null\);refresh\(\);\}\}/);
  assert.match(list,/<Link href=\{item\.href\}/);
  assert.match(consultation,/slot\.filters\?\.cycleIdOverride/);
 });
});
