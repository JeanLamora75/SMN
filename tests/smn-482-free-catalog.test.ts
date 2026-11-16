import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateFreeModel,freeCatalogSnapshot} from "../src/server/ai-connections/free-catalog";
const read=(x:string)=>readFileSync(x,"utf8");
test("SMN-482 denies unverified, unknown, opaque and auto-selected models",()=>{
 for(const [p,m] of [["gemini","gemini-2.5-flash"],["groq","llama-3.3-70b-versatile"],
   ["openrouter","openrouter/free"],["openrouter","vendor/model:free"],
   ["openrouter","vendor/model:auto"],["unknown","free"]]){
   assert.equal(evaluateFreeModel(p,m).allowed,false,p+":"+m);
 }
 assert.equal(freeCatalogSnapshot().qualified.length,0);
 assert.equal(freeCatalogSnapshot().requiresManualQualification,true);
});
test("SMN-482 no paid fallback nor untrusted remote auto-approval",()=>{
 const catalog=read("src/server/ai-connections/free-catalog.ts");
 const api=read("src/app/api/admin/ai-connections/free-models/route.ts");
 assert.match(catalog,/REVIEWED_FREE_MODELS:readonly FreeModelEvidence\[\]=Object\.freeze\(\[\]\)/);
 assert.doesNotMatch(api,/fetch\(|POST|apiKey|remoteAutoApprove/);
 const registry=read("src/server/ai-connections/registry.ts");
 assert.match(registry,/evaluateFreeModel/);
});
test("SMN-482 atomic quota reservation and offline schema are included in both installations",()=>{
 const quota=read("src/server/ai-connections/free-quota.ts");
 const sql=read("prisma/migrations/20261116_smn482_free_quota/migration.sql");
 const install=read("src/server/installation/install.ts");
 const pack=read("scripts/windows/package-portable.mjs");
 assert.match(quota,/ON CONFLICT/);
 assert.match(quota,/request_count < \$3/);
 assert.match(sql,/PRIMARY KEY\(installation_id,connection_id,quota_day\)/);
 assert.match(install,/20261116_smn482_free_quota/);
 assert.match(pack,/20261116_smn482_free_quota/);
 assert.doesNotMatch(quota,/fetch\(/);
});

test("SMN-482 quota relation is accepted by the physical installation diagnostic",()=>{
 const contract=read("src/server/installation/contract.ts");
 const probe=read("src/server/db/probe.ts");
 const diagnostic=read("src/server/installation/diagnostic.ts");
 assert.match(contract,/public\\.smn_ai_free_request_quota:r/);
 assert.match(probe,/INSTALLATION_RELATIONS/);
 assert.match(diagnostic,/INSTALLATION_RELATIONS/);
});
