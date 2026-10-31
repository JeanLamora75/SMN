import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("linking a cycle does not invoke parent modal dismiss callback",()=>{
 const s=read("src/app/app/admin/registries/registry-cycles.tsx");
 assert.doesNotMatch(s,/setData\(d=>d\?\{\.\.\.d,linkedIds:[^\n]*onSaved\?\.\(\)/);
 assert.match(s,/aria-expanded=\{expanded\}/);
 assert.doesNotMatch(s,/window\.confirm\(/);
 assert.match(s,/setExpanded\(value=>!value\)/);
});
test("cycles are constrained by registry period with existing links still visible",()=>{
 const s=read("src/server/registries/cycle-links.ts");
 assert.match(s,/s\.start_at::date < \$3::date/);
 assert.match(s,/s\.end_at::date > \$2::date/);
 assert.match(s,/EXISTS \(SELECT 1 FROM public\.smn_registry_cycle_link/);
 assert.match(s,/\$4::text='unlinked'/);
 assert.match(s,/r\.team_id=\$3/);
 assert.match(s,/smn_registry_item_audit/);
 assert.match(s,/resolvedOn/);
});
