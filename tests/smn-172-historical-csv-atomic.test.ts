import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
describe("SMN-172 — confirmation atomique du lot CSV",()=>{
 it("une transaction encadre toutes les écritures et l'audit",()=>{
  const source=readFileSync("src/server/historical-csv/confirm.ts","utf8");
  assert.match(source,/db\.query\("BEGIN"\)/);
  assert.match(source,/db\.query\("COMMIT"\)/);
  assert.match(source,/db\.query\("ROLLBACK"\)/);
  assert.match(source,/smn_historical_csv_change/);
 });
 it("revalide la prévisualisation et refuse toute valeur concurrente modifiée",()=>{
  const source=readFileSync("src/server/historical-csv/confirm.ts","utf8");
  assert.match(source,/validateHistoricalCsvBusiness/);
  assert.match(source,/FOR UPDATE/);
  assert.match(source,/choice\.expectedValue!==row\.existingValue/);
  assert.match(source,/stale-preview/);
 });
 it("les choix de conservation ne provoquent aucune écriture cible",()=>{
  const source=readFileSync("src/server/historical-csv/confirm.ts","utf8");
  assert.match(source,/choice\.decision==="keep"\)\{preserved\+\+;continue;/);
 });
});
