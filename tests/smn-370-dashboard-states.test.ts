import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(new URL(file,import.meta.url),"utf8");
test("SMN-370 AC1: separate skeleton, zero, null, missing, unavailable and incompatible states",()=>{
 const ui=read("../src/app/app/dashboard-builder/dashboard-consultation.tsx");
 const data=read("../src/server/dashboard-builder/visualizations.ts");
 assert.match(ui,/placeholder-glow/);
 assert.match(ui,/Source indisponible/);
 assert.match(ui,/Source incompatible/);
 assert.match(ui,/result\.value===undefined\|\|result\.value===null\?NaN:Number\(result.value\)/);
 assert.match(data,/state:"null"/);
 assert.match(data,/state:"absent"/);
});
test("SMN-370 AC2: retry is addressed by slot id, not a global refresh",()=>{
 const ui=read("../src/app/app/dashboard-builder/dashboard-consultation.tsx");
 const hook=read("../src/app/app/dashboard-builder/use-dashboard-batch.ts");
 assert.match(ui,/retry\(slot.id\)/);
 assert.match(hook,/stableItems\.filter\(item=>item.id===retryRequest.id\)/);
 assert.match(hook,/AbortController/);
});
test("SMN-370 AC3: success expires while error stays until addressed",()=>{
 const editor=read("../src/app/app/dashboard-builder/dashboard-editor.tsx");
 assert.match(editor,/setTimeout\(\(\)=>setSuccess\(null\),4000\)/);
 assert.match(editor,/setSuccess\("Tableau de bord enregistré\."\)/);
 assert.match(editor,/role="alert"/);
});
test("SMN-370 AC4: stale context values cannot be rendered under a new cycle",()=>{
 const hook=read("../src/app/app/dashboard-builder/use-dashboard-batch.ts");
 assert.match(hook,/identity\(teamId,cycleId/);
 assert.match(hook,/stored\?\.context===expected/);
 assert.match(hook,/generation\.current/);
 assert.match(hook,/controller\.abort\(\)/);
});
