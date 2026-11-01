import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
test("v33 CSV requires explicit, unique manual indicator mapping and team",()=>{
 const source=read("src/server/historical-csv/v33.ts");
 assert.match(source,/new Set\(input\.mappings\.map\(x=>x\.code\)\)\.size/);
 assert.match(source,/new Set\(input\.mappings\.map\(x=>x\.indicatorId\)\)\.size/);
 assert.match(source,/d\.indicator_type='manual'/);
 assert.match(source,/s\.is_active=true/);
 assert.match(source,/c\.team_id=\$1/);
});
test("v33 CSV transaction protects closed cycles, snapshot and previous values",()=>{
 const source=read("src/server/historical-csv/v33.ts");
 assert.match(source,/cycles\.rows\.some\(c=>c\.status==="closed"\)/);
 assert.match(source,/c\.expectedValue!==row\.existingValue/);
 assert.match(source,/await db\.query\("BEGIN"\)/);
 assert.match(source,/await db\.query\("ROLLBACK"\)/);
 assert.match(source,/recalculateIndicatorResultsWithinTransaction/);
 assert.match(source,/smn_indicator_cycle_revision/);
 assert.match(source,/smn_historical_csv_change/);
 assert.doesNotMatch(source,/UPDATE public\.smn_sprint_closure_snapshot/);
});
test("v33 CSV import is exposed only through the authenticated administrative path",()=>{
 const api=read("src/app/api/admin/historical-csv/v33/route.ts");
 const page=read("src/app/app/admin/historical-csv/page.tsx");
 assert.match(api,/actor\.role!=="admin"/);
 assert.match(api,/confirmCsvV33/);
 assert.match(page,/v33\?<V33HistoricalCsvImport\/>:<HistoricalCsvTemplateView\/>/);
});
