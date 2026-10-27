import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("le cycle par défaut doit appartenir à la liste filtrée par équipe",()=>{
 const source=readFileSync("src/app/app/private-shell.tsx","utf8");
 assert.match(source,/result\.items\.some\(item=>item\.id===result\.defaultCycleId\)/);
 assert.match(source,/validDefault\?\?result\.items\[0\]/);
});
test("la navigation multiéquipes ne reprend aucun filtre d'URL obsolète",()=>{
 const source=readFileSync("src/app/app/private-shell.tsx","utf8");
 assert.match(source,/const params=teamSwitcherEnabled\?new URLSearchParams\(\)/);
});
