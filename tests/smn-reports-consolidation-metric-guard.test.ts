import test from "node:test";
import assert from "node:assert/strict";
import {preserveAuthoritativeMetrics} from "../src/server/reports/report-documents";
test("stale Studio content cannot overwrite an accepted metric refresh",()=>{
 const stored={metrics:{committedSp:{value:24,unit:"SP"}},dataSource:{source:"current",snapshotVersion:2},userNotes:{intro:"Old"}};
 const oldEditor={metrics:{committedSp:{value:20,unit:"SP"}},dataSource:{source:"current",snapshotVersion:1},userNotes:{intro:"New"}};
 const merged=preserveAuthoritativeMetrics(stored,oldEditor);
 assert.equal((merged.metrics as typeof stored.metrics).committedSp.value,24);
 assert.equal((merged.dataSource as typeof stored.dataSource).snapshotVersion,2);
 assert.deepEqual(merged.userNotes,{intro:"New"});
});
