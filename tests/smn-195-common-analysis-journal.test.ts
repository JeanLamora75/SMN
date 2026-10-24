import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {normalizeAnalysisFilters} from "../src/server/ai-briefs/journal";
test("date, origin and cycle filters are validated",()=>{
 assert.deepEqual(normalizeAnalysisFilters({type:"human",from:"2026-10-01",to:"2026-10-25"}),{type:"human",from:"2026-10-01",to:"2026-10-25"});
 assert.equal(normalizeAnalysisFilters({type:"bot"}),null);
 assert.equal(normalizeAnalysisFilters({from:"2026-11-01",to:"2026-10-01"}),null);
 assert.equal(normalizeAnalysisFilters({cycleId:"invalid"}),null);
});
test("journal scopes both origins by team and links to original brief",()=>{
 const service=readFileSync("src/server/ai-briefs/journal.ts","utf8");
 const page=readFileSync("src/app/app/ai-briefs/journal/page.tsx","utf8");
 assert.match(service,/h.team_id=\$1/);assert.match(service,/a.team_id=\$1/);
 assert.match(service,/r.deleted_at IS NULL/);
 assert.match(service,/UNION ALL/);
 assert.match(page,/canAccess\(actor,"read"/);
 assert.match(page,/Consulter le TXT original immuable/);
 assert.match(page,/Aucune analyse trouvée/);
});
