import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("v29 is recognized by installation diagnostic and probing",()=>{
 const diag=read("src/server/installation/diagnostic.ts");
 const probe=read("src/server/db/probe.ts");
 const contract=read("src/server/installation/contract.ts");
 assert.match(diag,/const isV29 = records\[0\]\.schema_version >= 29/);
 assert.match(diag,/snapshot\.linksSchemaValid/);
 assert.doesNotMatch(probe,/FROM public\\._prisma_migrations LIMIT/);
 for(const table of ["smn_link","smn_link_category","smn_link_audit"])
  assert.ok(contract.includes("public."+table+":r"));
});
test("admin team preference and registry reads remain enabled on v29",()=>{
 const active=read("src/server/teams/active.ts");
 const registry=read("src/server/registries/team-access.ts");
 const resolve=read("src/server/teams/resolve.ts");
 assert.match(active,/\[28,29\]\.includes\(installation\.schemaVersion\)/);
 assert.match(registry,/version===28\|\|version===29/);
 assert.match(resolve,/schema_version IN \(28,29\)/);
});
test("migration is explicit, refuses implicit execution",()=>{
 const apply=read("scripts/apply-links-migration.ts");
 assert.match(apply,/--apply/);
 assert.match(apply,/backup-file/);
 assert.match(apply,/ROLLBACK/);
 assert.match(apply,/schema_version!==28/);
});

test("v29 still probes multi-team integrity instead of silently skipping it",()=>{
 const probe=read("src/server/db/probe.ts");
 assert.match(probe,/if\(\(installations\.rows\[0\]\?\.schema_version\?\?0\)>=28\)/);
 assert.match(probe,/multiTeamSchemaValid=!!row\?\.product_nullable/);
});
