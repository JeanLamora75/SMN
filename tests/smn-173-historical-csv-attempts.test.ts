import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
describe("SMN-173 — journal des tentatives CSV",()=>{
 it("sépare les cinq statuts d'opération",()=>{
  const s=readFileSync("src/server/historical-csv/attempts.ts","utf8");
  for(const status of ["preview-valid","preview-refused","preview-cancelled","import-confirmed","import-refused"])
   assert.ok(s.includes(status));
 });
 it("stocke les compteurs et cycles sans contenu CSV brut",()=>{
  const s=readFileSync("src/server/historical-csv/attempts.ts","utf8");
  for(const field of ["read_count","recognized_count","applied_count","preserved_count","rejected_count","cycle_ids","errors"])
   assert.ok(s.includes(field));
  assert.doesNotMatch(s,/csv_raw|raw_csv|file_content/);
 });
 it("enregistre la réussite dans la transaction métier",()=>{
  const s=readFileSync("src/server/historical-csv/confirm.ts","utf8");
  assert.ok(s.indexOf('status:"import-confirmed"')<s.indexOf('await db.query("COMMIT")'));
 });
});
