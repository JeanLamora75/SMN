import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");
test("SMN-480 schema stores metadata but never plaintext API keys",()=>{
 const sql=read("prisma/migrations/20261116_smn480_ai_connections/migration.sql");
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.smn_ai_connection/);
 assert.match(sql,/provider_id IN \('gemini','groq','openrouter'\)/);
 assert.doesNotMatch(sql,/\b(api_key|secret_key|access_token|plaintext)\s+(?:text|varchar|bytea)/i);
 assert.match(sql,/enabled = false OR \(credential_state = 'configured' AND last_test_status = 'passed'\)/);
});
test("SMN-480 existing and fresh installs have explicit additive migrations",()=>{
 const install=read("src/server/installation/install.ts");
 const packageFile=read("scripts/windows/package-portable.mjs");
 const migration="20261116_smn480_ai_connections";
 assert.match(install,new RegExp(migration));
 assert.match(packageFile,new RegExp(migration));
 const script=read("scripts/apply-smn-480-ai-connections.ts");
 assert.match(script,/SMN_AI_CONNECTION_BACKUP_VERIFIED/);
 assert.match(script,/ROLLBACK/);
});
test("SMN-480 API is restricted to admin and metadata only",()=>{
 const route=read("src/app/api/admin/ai-connections/route.ts");
 const service=read("src/server/ai-connections/registry.ts");
 assert.match(route,/authorizeApi\(req,"write",scope\)/);
 assert.match(service,/installation_id='singleton'/);
 assert.match(service,/revision=revision\+1/);
 assert.match(service,/credential_state='missing'/);
 assert.doesNotMatch(service,/\bapiKey\b|\bsecretValue\b/);
});

test("SMN-480 native installation diagnostics explicitly recognize the additive table",()=>{
 const contract=read("src/server/installation/contract.ts");
 assert.match(contract,/public\\.smn_ai_connection:r/);
 const diagnostic=read("src/server/installation/diagnostic.ts");
 assert.match(diagnostic,/INSTALLATION_RELATIONS/);
 const probe=read("src/server/db/probe.ts");
 assert.match(probe,/INSTALLATION_RELATIONS/);
});
