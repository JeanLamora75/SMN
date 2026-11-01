import {test} from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("SMN-349 uses display preferences and never coerces missing data to zero",()=>{
 const sql=read("src/server/indicators/reporting.ts"),ui=read("src/app/app/admin/indicators/reporting-view.tsx"),api=read("src/app/api/admin/indicators/reporting/route.ts");
 assert.match(sql,/display_preference/);assert.match(sql,/is_visible=true/);assert.match(sql,/deleted_at IS NULL/);
 assert.match(sql,/CASE WHEN result_state='available' THEN value::text ELSE NULL/);
 assert.match(sql,/ORDER BY p.display_order/);assert.match(ui,/p.y!==null&&i>0&&points\[i-1\].y!==null/);
 assert.match(ui,/image\/png/);assert.match(api,/smn_indicator_team_grant/);
});
