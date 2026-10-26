import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {canConfirmAnnualDiagnostic,diagnosticDate,parseValidationDiagnostic}
 from "../src/lib/countries/annual-validation";

const base={country:"FR",year:2026,revision:2,fingerprint:"a".repeat(64),
 count:11,status:"partial",source:"FR.csv",blocking:[],warnings:[
  {code:"national-completeness-unverified",severity:"warning"},
  {code:"national-only",severity:"warning"}],
 administrativeValidated:false,archived:false};

describe("SMN-276 — Diagnostic de confirmation annuelle",()=>{
 it("accepte seulement le diagnostic du pays et du millésime concernés",()=>{
  assert.deepEqual(parseValidationDiagnostic(base,"FR",2026),base);
  assert.equal(parseValidationDiagnostic(base,"FR",2027),null);
  assert.equal(parseValidationDiagnostic(base,"DE",2026),null);
  assert.equal(parseValidationDiagnostic({...base,fingerprint:"bad"},"FR",2026),null);
  assert.equal(parseValidationDiagnostic({...base,count:-1},"FR",2026),null);
 });
 it("sépare strictement anomalies et avertissements",()=>{
  const problem={code:"invalid-date",severity:"blocking",details:"2026-02-30"};
  assert.equal(parseValidationDiagnostic({...base,blocking:[problem]},"FR",2026)?.blocking.length,1);
  assert.equal(parseValidationDiagnostic({...base,warnings:[problem]},"FR",2026),null);
  assert.equal(parseValidationDiagnostic({...base,blocking:[{code:"surprise",severity:"blocking"}]},"FR",2026),null);
 });
 it("n'autorise jamais la validation sans case ou avec un blocage",()=>{
  const d=parseValidationDiagnostic(base,"FR",2026)!;
  assert.equal(canConfirmAnnualDiagnostic(d,false),false);
  assert.equal(canConfirmAnnualDiagnostic(d,true),true);
  assert.equal(canConfirmAnnualDiagnostic(d,true,true),false);
  assert.equal(canConfirmAnnualDiagnostic(d,true,false,true),false);
  assert.equal(canConfirmAnnualDiagnostic({...d,count:0},true),false);
  assert.equal(canConfirmAnnualDiagnostic({...d,blocking:[{code:"empty-year",severity:"blocking"}]},true),false);
  assert.equal(canConfirmAnnualDiagnostic({...d,archived:true},true),false);
  assert.equal(canConfirmAnnualDiagnostic({...d,administrativeValidated:true},true),false);
 });
 it("ne propose un accès date que pour un détail au format de date",()=>{
  assert.equal(diagnosticDate({code:"invalid-date",severity:"blocking",details:"2026-02-30"}),"2026-02-30");
  assert.equal(diagnosticDate({code:"count-mismatch",severity:"blocking",details:"11 / 10"}),null);
 });
});
