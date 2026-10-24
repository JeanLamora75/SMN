import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
describe("SMN-169 — aperçu CSV sans écriture",()=>{
 it("le service ne modifie aucune table",()=>{
  const source=readFileSync("src/server/historical-csv/preview.ts","utf8");
  assert.doesNotMatch(source,/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s+(?:INTO|TABLE|FROM|public)/i);
  assert.match(source,/existingValue/);
 });
 it("l’API annonce la non-confirmabilité et retourne un aperçu",()=>{
  const source=readFileSync("src/app/api/admin/historical-csv/validate/route.ts","utf8");
  assert.match(source,/confirmable:false/);
  assert.match(source,/previewHistoricalCsv/);
 });
 it("le changement de fichier rend l’aperçu précédent obsolète",()=>{
  const source=readFileSync("src/app/app/admin/historical-csv/template-view.tsx","utf8");
  assert.match(source,/version\.current\+\+/);
  assert.match(source,/version\.current===snapshot/);
 });
});
