import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("replanification conserve les fiches et les liens",()=>{
 const src=readFileSync("src/server/sprints/reschedule.ts","utf8");
 assert.match(src,/registryImpact/);
 assert.match(src,/smn_registry_cycle_link/);
 assert.match(src,/outside:r\.dueOn/);
 assert.doesNotMatch(src,/UPDATE public\.smn_registry_item|DELETE FROM public\.smn_registry_cycle_link/);
});
test("historisation existante d'une correction volontaire reste dans le service registre",()=>{
 const src=readFileSync("src/server/registries/items.ts","utf8");
 assert.match(src,/smn_registry_item_audit/);
 assert.match(src,/revision=revision\+1/);
});
