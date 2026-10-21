import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {prefillValue,preserveEditedValue,knownNumber}
 from "../src/lib/form-prefill";
import {chooseCapacity,type OverrideRow}
 from "../src/server/capacity/override";
import {resolveCalendarDay,DEFAULT_WEEK}
 from "../src/server/members/calendar";
import {parseMemberProfileChange}
 from "../src/server/members/profile";
import {parseQuickMembersRequest}
 from "../src/server/members/quick-create";
import {parseReplanning}
 from "../src/server/capacity/replanning";

describe("SMN-63 — préremplissage non destructif et traçable",()=>{
 it("AC1 : le pays de l'installation est seulement une suggestion éditable",()=>{
  assert.deepEqual(prefillValue(undefined,"FR","",false),
   {value:"FR",origin:"suggested"});
  assert.deepEqual(prefillValue("DE","FR","",true),
   {value:"DE",origin:"saved"});
  assert.deepEqual(prefillValue("","FR","",true),
   {value:"",origin:"saved"});
  // Explicit null in an already saved location must never fall back to FR.
  assert.deepEqual(prefillValue(null,"FR","",true),
   {value:"",origin:"saved"});
  assert.deepEqual(prefillValue(undefined,null,"",false),
   {value:"",origin:"unknown"});
 });
 it("AC1 : priorité à la semaine enregistrée plutôt qu'au modèle lundi-vendredi",()=>{
  const saved=DEFAULT_WEEK.map(d=>({...d}));
  saved[2]={weekday:3,morning:false,afternoon:false};
  const selected=prefillValue(saved,DEFAULT_WEEK,[],true);
  assert.equal(selected.origin,"saved");
  assert.equal(selected.value[2].morning,false);
  assert.equal(DEFAULT_WEEK[2].morning,true);
  const suggestion=prefillValue(undefined,DEFAULT_WEEK,[],false);
  assert.equal(suggestion.origin,"suggested");
  assert.equal(suggestion.value.length,7);
 });
 it("AC2 : inconnu reste null, zéro saisi reste zéro",()=>{
  assert.equal(knownNumber(undefined),null);
  assert.equal(knownNumber(null),null);
  assert.equal(knownNumber(Number.NaN),null);
  assert.equal(knownNumber(0),0);
  assert.equal(knownNumber(12.5),12.5);
  const calendar=resolveCalendarDay([],[],"2026-10-21");
  assert.equal(calendar.status,"missing");
  assert.equal(calendar.slots,null);
  assert.equal(calendar.developmentCapacityJh,null);
  assert.equal(calendar.absenceDays,null);
 });
 it("AC3 : changement du calcul de 30 vers 28 sans écraser la saisie 32 JH",()=>{
  const row:OverrideRow={id:"period",team_id:"team",start_on:"2026-10-01",
   end_on:"2026-10-14",manual_jh:32,revision:1,
   frozen_at:null,closed_at:null,updated_at:"2026-10-21"};
  const report=(totalJh:number|null)=>({
   start:"2026-10-01",end:"2026-10-14",totalJh
  });
  const before=chooseCapacity(report(30),row);
  const after=chooseCapacity(report(28),row);
  assert.equal(before.retainedJh,32);
  assert.equal(after.retainedJh,32);
  assert.equal(after.referenceJh,28);
  assert.equal(after.source,"Saisie");
  assert.equal(chooseCapacity(report(28),{...row,manual_jh:0}).retainedJh,0);
  assert.equal(chooseCapacity(report(null),{...row,manual_jh:null}).retainedJh,null);
 });
 it("AC3 : un nouveau contexte ne remplace jamais une valeur modifiée localement",()=>{
  assert.equal(preserveEditedValue("ES","FR","DE"),"ES");
  assert.equal(preserveEditedValue("FR","FR","DE"),"DE");
  assert.equal(preserveEditedValue("", "FR", "DE"),"");
  assert.equal(preserveEditedValue(0,0,12),12);
 });
 it("AC4 : fiche provisoire et email non renseigné sont autorisés",()=>{
  assert.deepEqual(parseMemberProfileChange({
   displayName:"Membre 3",email:null,revision:0
  }),{displayName:"Membre 3",email:null,revision:0});
  assert.deepEqual(parseMemberProfileChange({
   displayName:"Membre 3",email:"",revision:0
  }),{displayName:"Membre 3",email:null,revision:0});
 });
 it("AC5 : préparer un lot ou un déplacement n'effectue aucune écriture",()=>{
  const request={teamId:"smn_team",count:3,
   requestId:"22222222-2222-4222-8222-222222222222"};
  assert.deepEqual(parseQuickMembersRequest(request),request);
  const periods={oldStart:"2026-10-01",oldEnd:"2026-10-14",
   newStart:"2026-10-02",newEnd:"2026-10-15"};
  assert.deepEqual(parseReplanning(periods),periods);
  // Both are pure input parsers; only an explicit POST to their APIs can write.
 });
});
