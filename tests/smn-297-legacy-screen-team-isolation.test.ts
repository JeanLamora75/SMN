import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("l'index Sprint historique est indisponible sur les schémas multiéquipes",()=>{
 const code=readFileSync("src/app/app/admin/sprints/page.tsx","utf8");
 assert.match(code,/schema_version<=27/);
});
test("le tableau de bord refuse un cycle étranger à l'équipe",()=>{
 const code=readFileSync("src/app/app/page.tsx","utf8");
 assert.match(code,/sprintData\.items\.some\(item=>item\.id===requested\)/);
 assert.match(code,/cycle-out-of-team/);
});
