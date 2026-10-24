import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
describe("SMN-174 — consultation des révisions historiques",()=>{
 it("conserve la ligne CSV et la qualité précédente dans l'audit",()=>{
  const s=readFileSync("src/server/historical-csv/confirm.ts","utf8");
  assert.match(s,/source_line/);assert.match(s,/previous_quality/);
  assert.match(s,/previousRevision/);
 });
 it("la consultation est lecture seule et réserve les détails aux administrateurs",()=>{
  const api=readFileSync("src/app/api/admin/historical-csv/revisions/route.ts","utf8");
  const source=readFileSync("src/server/historical-csv/revisions.ts","utf8");
  assert.match(api,/actor\.role!=="admin"/);
  assert.doesNotMatch(source,/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP)\s+(?:INTO|public|TABLE|FROM)/i);
 });
 it("montre avant et après sans changer rétroactivement la qualité",()=>{
  const view=readFileSync("src/app/app/admin/historical-csv/historical-revisions-panel.tsx","utf8");
  assert.match(view,/beforeQuality/);assert.match(view,/sourceLine/);assert.match(view,/batchId/);
 });
});
