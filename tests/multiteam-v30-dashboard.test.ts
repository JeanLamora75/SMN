import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("les versions v28 à v31 autorisent les lecteurs multiéquipes avec contexte explicite",()=>{
 const active=read("src/server/teams/active.ts");
 const resolve=read("src/server/teams/resolve.ts");
 const dashboard=read("src/server/dashboard/read.ts");
 const registry=read("src/server/registries/team-access.ts");
 assert.match(active,/\[28,29,30,31\]\.includes\(installation\.schemaVersion\)/);
 assert.match(resolve,/schema_version IN \(28,29,30,31\)/);
 assert.match(resolve,/\[28,29,30,31\]\.includes\(details\.rows\[0\]\.schema_version\)/);
 assert.match(dashboard,/\[28,29,30,31\]\.includes\(result\.rows\[0\]\.schema_version\)/);
 assert.match(registry,/version===31/);
});
