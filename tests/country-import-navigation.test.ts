import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {importExaminedYears,importProposedYears,navigableImportYears,parseCommittedImport,
 primaryYear,unchangedImport} from "../src/lib/countries/import-navigation";
import type {ImportPreview} from "../src/lib/countries/holiday-import";
const preview:ImportPreview={
 country:"FR",policy:"replace",fingerprint:"a".repeat(64),proposed:2,rejected:1,
 rows:[
 {line:2,date:"2026-05-01",name:"Fête",country:"FR",action:"create",reason:null,previousName:null},
 {line:3,date:"2042-12-25",name:"Fête",country:"FR",action:"replace",reason:null,previousName:"Ancien"},
 {line:4,date:"2021-01-01",name:"Fête",country:"FR",action:"reject",reason:"already-identical",previousName:null}
 ]
};
describe("SMN-278 — Retour vers les calendriers réellement importés",()=>{
 it("sépare les années parcourues des années réellement proposées",()=>{
  assert.deepEqual(importExaminedYears(preview),[2042,2026,2021]);
  assert.deepEqual(importProposedYears(preview),[2042,2026]);
 });
 it("utilise les années réellement committées retournées par le serveur",()=>{
  const result=parseCommittedImport({ok:true,created:1,replaced:1,changedYears:[2026,2042]},preview);
  assert.ok(result);
  assert.equal(result.yearsVerified,true);
  assert.deepEqual(result.changedYears,[2042,2026]);
  assert.equal(primaryYear(result,2025),2042);
  assert.deepEqual(navigableImportYears(result),[2042,2026]);
 });
 it("rejette les années impossibles et hors du périmètre de l'aperçu",()=>{
  const result=parseCommittedImport({ok:true,created:1,replaced:1,changedYears:[2024]},preview);
  assert.ok(result);
  assert.equal(result.yearsVerified,false);
  assert.deepEqual(result.changedYears,[]);
  assert.equal(primaryYear(result,2025),2025);
 });
 it("ne crée pas de transition trompeuse pour un fichier sans mutation",()=>{
  const zero={...preview,proposed:0,rejected:1,rows:[preview.rows[2]]};
  const result=unchangedImport(zero);
  assert.equal(result.committed,false);
  assert.deepEqual(result.changedYears,[]);
  assert.deepEqual(navigableImportYears(result),[2021]);
  assert.equal(primaryYear(result,2026),2026);
 });
 it("rejette les totaux incohérents plutôt que d'affirmer un commit vérifié",()=>{
  assert.equal(parseCommittedImport({ok:true,created:1,replaced:0,changedYears:[2026]},preview),null);
 });
});
