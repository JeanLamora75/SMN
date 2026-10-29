import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {evaluateSchemaCapability} from "../src/server/schema/compatibility";

test("une préférence d'équipe ne doit pas contourner la validation de version",()=>{
 const source=readFileSync(new URL("../src/server/teams/active.ts",import.meta.url),"utf8");
 assert.match(source,/evaluateSchemaCapability\(installation\.schemaVersion,"multi-team"\)/);
 assert.equal(source.includes("[28,29,30,31,32].includes"),false);
 assert.equal(evaluateSchemaCapability(33,"multi-team").ok,false);
});
test("le contexte sélectionné conserve ses conditions d'accès administrateur",()=>{
 const source=readFileSync(new URL("../src/server/teams/active.ts",import.meta.url),"utf8");
 assert.match(source,/a\.role='admin'/);
 assert.match(source,/a\.is_active=true/);
 assert.match(source,/t\.installation_id=p\.installation_id/);
});
