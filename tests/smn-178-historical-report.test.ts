import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
describe("SMN-178 — rapport historique transparent",()=>{
 it("la préparation distingue Sprint historique, sources et qualités",()=>{
  const c=readFileSync("src/server/reports/html-preview.ts","utf8");
  assert.match(c,/historical-created/);
  assert.match(c,/historicalEvidence/);
  assert.match(c,/historicalMetricQualities/);
  assert.match(c,/ORDER BY version DESC LIMIT 1/);
 });
 it("le rendu HTML rend explicites la rétrosaisie et l'absence de preuve",()=>{
  const c=readFileSync("src/app/app/admin/sprints/[sprintId]/report/preview/page.tsx","utf8");
  assert.match(c,/Sprint historique/);
  assert.match(c,/Qualité non attestée/);
  assert.match(c,/historique indisponible/);
 });
 it("l'aperçu n'enregistre pas de PDF ; l'export utilise une référence figée et une archive",()=>{
  const c=readFileSync("src/server/reports/html-preview.ts","utf8");
  assert.doesNotMatch(c,/storeFinalPdfArchive|generateFrozenPdf/);
  const pdf=readFileSync("src/app/api/admin/reports/sprints/[id]/pdf/route.ts","utf8");
  assert.match(pdf,/readFrozenReportReference/);
  assert.match(pdf,/storeFinalPdfArchive/);
  assert.match(pdf,/operationId/);
 });
});
