import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const migration=read("scripts/db-upgrade.ts");
const policy=read("scripts/db-upgrade-policy.ts");
const capture=read("src/server/indicators/closure-snapshot.ts");
const closure=read("src/server/sprints/closure.ts");
const reporting=read("src/server/indicators/reporting.ts");
const catalog=read("src/server/indicators/catalog.ts");
test("v33 upgrade only applies explicit, backed-up migrations",()=>{
 assert.match(migration,/SMN_V33_BACKUP_VERIFIED/);
 assert.match(migration,/before\.version===32/);
 assert.match(migration,/before\.version===33/);
 assert.match(policy,/version===33/);
 assert.match(migration,/BEGIN/);
});
test("v33 capture uses team-scoped manual and computed results with explicit states",()=>{
 assert.match(capture,/s\.team_id=\$1 AND s\.is_active=true/);
 assert.match(capture,/m\.cycle_type='scrum' AND m\.cycle_id=\$2/);
 assert.match(capture,/r\.cycle_type='scrum' AND r\.cycle_id=\$2/);
 assert.match(capture,/"not-recorded"/);
 assert.match(capture,/"unavailable"/);
});
test("closure appends immutable versioned v33 indicator snapshots",()=>{
 assert.match(closure,/captureCycleIndicators/);
 assert.match(closure,/indicatorsV33/);
 assert.match(closure,/COALESCE\(MAX\(version\),0\)\+1/);
 assert.match(closure,/INSERT INTO public\.smn_sprint_closure_snapshot/);
});
test("current dashboard has three legacy metric blocks plus separate v33 report",()=>{
 const overview=read("src/app/app/cycle-overview.tsx");
 const page=read("src/app/app/page.tsx");
 assert.match(overview,/KpiSprintScores/);
 assert.match(overview,/dashboard\.cockpit\.storyPoints/);
 assert.match(overview,/dashboard\.cockpit\.tickets/);
 assert.match(page,/screen="dashboard"/);
});
test("v33 reporting is team-scoped and currently reads live values (known gap)",()=>{
 assert.match(reporting,/WHERE team_id=\$1 AND deleted_at IS NULL/);
 assert.match(reporting,/smn_indicator_manual_value/);
 assert.match(reporting,/smn_indicator_computed_result/);
 assert.doesNotMatch(reporting,/FROM public\.smn_sprint_closure_snapshot/);
});
test("v33 display preferences have not yet implemented block assignment (known gap)",()=>{
 assert.match(catalog,/screenKey:ScreenKey;visible:boolean;order:number/);
 assert.doesNotMatch(catalog,/dashboard_block|dashboardBlock/);
});
