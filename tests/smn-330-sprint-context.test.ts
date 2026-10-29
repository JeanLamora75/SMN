import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("v32 utilise le mode de l'équipe sans repli global",()=>{
 const source=readFileSync(new URL("../src/server/sprints/context.ts",import.meta.url),"utf8");
 assert.match(source,/CASE WHEN i\.schema_version>=32 THEN/);
 assert.match(source,/agile_mode/);
 assert.match(source,/is_archived/);
 assert.match(source,/s\.team_id=\$1/);
});
test("les colonnes v32 restent optionnelles pour la lecture SQL du legacy",()=>{
 const source=readFileSync(new URL("../src/server/sprints/context.ts",import.meta.url),"utf8");
 assert.match(source,/to_jsonb\(t\)/);
 assert.doesNotMatch(source,/THEN t\.agile_mode/);
 assert.doesNotMatch(source,/t\.is_archived=false/);
});
