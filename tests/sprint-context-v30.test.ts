import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("le sélecteur Sprint accepte les schémas v28 à v31",()=>{
 const source=readFileSync(new URL("../src/app/api/sprints/context/route.ts",import.meta.url),"utf8");
 assert.match(source,/evaluateSchemaCapability\(version\.rows\[0\]\.schema_version,"multi-team"\)\.ok/);
 assert.match(source,/resolveAdminTeam\(db/);
 assert.match(source,/readSprintContext\(db,context\.team_id\)/);
 assert.match(source,/if\(version\.rows\[0\]\.schema_version>27\)throw/);
});
