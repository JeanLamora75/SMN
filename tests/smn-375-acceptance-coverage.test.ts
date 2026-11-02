import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {DASHBOARD_RX_TRACEABILITY,DASHBOARD_RX_SCENARIOS} from "../src/lib/dashboard-builder/acceptance-traceability";

test("SMN-375 AC1: 33 UX + 10 MAQ decisions all mapped to 22 RX scenarios",()=>{
 const expected=[...Array.from({length:33},(_,i)=>`UX-DB-${String(i+1).padStart(2,"0")}`),
  ...Array.from({length:10},(_,i)=>`MAQ-DB-${String(i+1).padStart(2,"0")}`)];
 assert.deepEqual(DASHBOARD_RX_TRACEABILITY.map(x=>x.requirement).sort(),expected.sort());
 assert.equal(new Set(DASHBOARD_RX_TRACEABILITY.map(x=>x.requirement)).size,43);
 const seen=new Set(DASHBOARD_RX_TRACEABILITY.flatMap(x=>x.scenarios));
 assert.deepEqual([...seen].sort(),DASHBOARD_RX_SCENARIOS);
});
test("SMN-375 AC1: source UX reference actually defines all 22 RX IDs",()=>{
 const ux=readFileSync(new URL("../_bmad-output/planning-artifacts/dashboard-builder/dashboard-builder-dossier-ux-bmad-v1.md",import.meta.url),"utf8");
 for(const id of DASHBOARD_RX_SCENARIOS)assert.ok(ux.includes(`| ${id} |`),id);
});
test("SMN-375 AC2: dedicated tests exist for feature stories 361–374",()=>{
 // Explicit smoke references give the release report a stable, inspectable dependency.
 for(const p of [
  "../tests/smn-364-dashboard-composition.test.ts",
  "../tests/smn-365-slot-wizard.test.ts",
  "../tests/smn-366-slot-options.test.ts",
  "../tests/smn-367-dashboard-reorder.test.ts",
  "../tests/smn-368-dashboard-dimensions.test.ts",
  "../tests/smn-369-block-actions.test.ts",
  "../tests/smn-370-dashboard-states.test.ts",
  "../tests/smn-371-dashboard-reset.test.ts",
  "../tests/smn-372-dashboard-copy.test.ts",
  "../tests/smn-373-dashboard-lists.test.ts",
  "../tests/smn-374-dashboard-cutover.test.ts",
 ])assert.ok(existsSync(new URL(p,import.meta.url)),p);
});
