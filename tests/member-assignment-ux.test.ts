import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const detail=source("src/app/app/admin/members/[id]/member-detail.tsx");
const editor=source("src/app/app/admin/members/assignment-editor.tsx");
const history=source("src/app/app/admin/members/[id]/member-assignment-history.tsx");

describe("Fiche membre V2 — onglet Affectation et modale",()=>{
 it("affiche le tableau historique dans le bloc Rôles et affectation",()=>{
  const begin=detail.indexOf('tab==="assignment"');
  const next=detail.indexOf('tab==="calendar"',begin);
  assert.ok(begin>=0&&next>begin);
  const assignmentTab=detail.slice(begin,next);
  assert.match(assignmentTab,/memberUX\.rolesTitle/);
  assert.match(assignmentTab,/<MemberAssignmentHistory/);
  assert.match(assignmentTab,/memberId=\{member\.id\}/);
  assert.match(history,/members\.assignment\.history/);
  assert.match(history,/versions\.map\(v=>/);
  assert.match(history,/table-responsive/);
  for(const key of ["version","effectiveFrom","contract","allocation","contribution","sharesTitle"]){
   assert.ok(history.includes('members.assignment.'+key),key);
  }
 });
 it("charge les versions enregistrées depuis l'API existante et gère les états",()=>{
  assert.match(history,/fetch\("\/api\/admin\/members\/"/);
  assert.match(history,/encodeURIComponent\(memberId\)\+"\/assignment"/);
  assert.match(history,/cache:"no-store"/);
  assert.match(history,/response\.ok/);
  assert.match(history,/members\.assignment\.loading/);
  assert.match(history,/members\.assignment\.loadFailed/);
  assert.match(history,/members\.assignment\.empty/);
 });
 it("rafraîchit l'historique après l'enregistrement d'une nouvelle version",()=>{
  assert.match(detail,/setAssignmentRefreshKey\(current=>current\+1\)/);
  assert.match(detail,/key=\{member\.id\+"-"\+assignmentRefreshKey\}/);
  assert.match(detail,/<AssignmentEditor/);
  assert.match(detail,/onSaved=\{saved\}/);
 });
 it("affiche une ligne date, une ligne trois taux, puis une ligne trois rôles",()=>{
  const token='<div className="row g-3">';
  const first=editor.indexOf(token);
  const second=editor.indexOf(token,first+token.length);
  const third=editor.indexOf(token,second+token.length);
  assert.ok(first>=0&&second>first&&third>second);
  const dateRow=editor.slice(first,second);
  const rateRow=editor.slice(second,third);
  const rolesRow=editor.slice(third);
  assert.match(dateRow,/id="effective-from"/);
  assert.doesNotMatch(dateRow,/contractPercent|allocationPercent|contributionPercent/);
  for(const field of ["contractPercent","allocationPercent","contributionPercent"])assert.ok(rateRow.includes(field));
  for(const field of ["scrumMaster","productOwner","developer"])assert.ok(rolesRow.includes(field));
  assert.match(rateRow,/className="col-md-4"/);
  assert.match(rolesRow,/className="col-sm-4"/);
 });
 it("garde l'édition et les validations, mais aucun historique dans la modale",()=>{
  assert.doesNotMatch(editor,/members\.assignment\.history|members\.assignment\.historyNote/);
  assert.doesNotMatch(editor,/<table|<thead|<tbody/);
  assert.match(editor,/onSubmit=\{submit\}/);
  assert.match(editor,/Object\.values\(shares\)\.reduce/);
  assert.match(editor,/revision:state\.latestRevision/);
 });
 it("utilise les libellés existants en français et en anglais",()=>{
  for(const locale of ["fr","en"]){
   const messages=JSON.parse(source("src/i18n/"+locale+".json")).members.assignment;
   for(const key of ["history","version","effectiveFrom","contract","allocation","contribution",
    "sharesTitle","shareSummary","historyNote","loading","loadFailed","empty"]){
    assert.ok(typeof messages[key]==="string"&&messages[key].trim(),locale+" "+key);
   }
  }
 });
});
