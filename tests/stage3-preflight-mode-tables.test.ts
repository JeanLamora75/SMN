import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
test("le précontrôle exige la table Kanban seulement pour une équipe Kanban active",()=>{
 const code=readFileSync(new URL("../scripts/stage3-preflight.ts",import.meta.url),"utf8");
 assert.match(code,/hasKanban=modes\.rows\.some/);
 assert.match(code,/hasKanban\?\["kanban"\]:\[\]/);
 assert.match(code,/READ ONLY/);
 assert.match(code,/ROLLBACK/);
});
