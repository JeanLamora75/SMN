import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {sprintZonedInput,sprintZonedToIso} from "../src/lib/sprint-detail-time";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

describe("Fiche Sprint D1 — fuseau et changements d'heure",()=>{
 it("affiche l'heure civile Europe/Paris indépendamment du navigateur",()=>{
  assert.equal(sprintZonedInput("2026-10-23T07:00:00.000Z","Europe/Paris"),
   "2026-10-23T09:00:00");
  assert.equal(sprintZonedInput("invalide","Europe/Paris"),null);
 });
 it("convertit une saisie locale en ISO UTC canonique, avec ou sans secondes",()=>{
  assert.deepEqual(sprintZonedToIso("2026-10-23T09:00","Europe/Paris"),
   {ok:true,iso:"2026-10-23T07:00:00.000Z"});
  assert.deepEqual(sprintZonedToIso("2026-10-23T09:00:30","Europe/Paris"),
   {ok:true,iso:"2026-10-23T07:00:30.000Z"});
 });
 it("refuse une heure locale inexistante pendant le passage à l'heure d'été",()=>{
  assert.deepEqual(sprintZonedToIso("2026-03-29T02:30:00","Europe/Paris"),
   {ok:false,error:"nonexistent"});
 });
 it("ne choisit pas arbitrairement une heure pendant le retour à l'heure d'hiver",()=>{
  assert.deepEqual(sprintZonedToIso("2026-10-25T02:30:00","Europe/Paris"),
   {ok:false,error:"ambiguous"});
  assert.deepEqual(sprintZonedToIso("2026-10-25T02:30:00","Europe/Paris",
   "2026-10-25T00:30:00.000Z"),{ok:true,iso:"2026-10-25T00:30:00.000Z"});
 });
 it("rejette dates non calendaires et champs non conformes",()=>{
  assert.deepEqual(sprintZonedToIso("2026-02-30T09:00:00","Europe/Paris"),
   {ok:false,error:"invalid"});
  assert.deepEqual(sprintZonedToIso("2026-10-23T09:90","Europe/Paris"),
   {ok:false,error:"invalid"});
 });
});

describe("Fiche Sprint D1 — contrats d'écran et de droits",()=>{
 const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
 const nav=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-tabs.tsx");
 const shared=read("src/lib/sprint-detail-tabs.ts");
 const editor=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-editor.tsx");
 const icon=read("src/app/app/bootstrap-icon.tsx");
 it("réutilise le lecteur collectif, la route par identifiant et le 404 hors équipe",()=>{
  assert.match(page,/canAccess\(account,"read",collective\)/);
  assert.match(page,/context\.items\.find\(item=>item\.id===sprintId\)/);
  assert.match(page,/if\(result===null\)notFound\(\)/);
  assert.match(page,/withDashboardRead\(/);
 });
 it("conserve les objectifs dans leur onglet, sans synthèse factice",()=>{
  assert.match(page,/active==="objectives"/);
  assert.match(page,/readSprintDetailGoals\(/);
  assert.doesNotMatch(nav,/synthesis|summary/i);
  const keys=shared.match(/"objectives","ceremonies","capacity","indicators","registers","trends","review"/);
  assert.ok(keys);
  assert.match(page,/role="tabpanel"/);
 });
 it("fournit sept vrais onglets accessibles, avec navigation au clavier",()=>{
  assert.match(nav,/role="tablist"/);
  assert.match(nav,/role="tab"/);
  assert.match(nav,/aria-selected=/);
  assert.match(nav,/ArrowRight/);
  assert.match(nav,/ArrowLeft/);
  assert.match(nav,/tabIndex=\{active===key\?0:-1\}/);
 });
 it("n'affiche aucun crayon modifiable à un compte sans droit admin",()=>{
  assert.match(page,/canManage=canAccess\(account,"write"/);
  assert.match(page,/\{canManage&&<SprintDetailEditor kind="name"/);
  assert.match(page,/\{canManage&&cycle\.status!=="closed"&&/);
  assert.match(icon,/case "pencil-square"/);
 });
 it("utilise les commandes métier sécurisées, avec aperçu obligatoire des dates",()=>{
  assert.match(editor,/method:"PATCH"/);
  assert.match(editor,/\/api\/admin\/sprints\/reschedule/);
  assert.match(editor,/method:"POST"/);
  assert.match(editor,/token:preview\.token/);
  assert.match(editor,/sprintZonedToIso\(/);
 });
 it("ne prétend pas que les futurs onglets sont déjà alimentés",()=>{
  for(const key of ["pendingCeremonies","pendingCapacity","pendingIndicators",
   "pendingRegisters","pendingTrends","pendingReview"]){
   assert.ok(page.includes("sprintDetail."+key),key);
  }
 });
});
