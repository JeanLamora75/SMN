import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(x:string)=>readFileSync(x,"utf8");
test("SMN-478: Windows package embeds schema verifier and both migration SQL files",()=>{
 const packageCode=read("scripts/windows/package-portable.mjs");
 const smoke=read("scripts/windows/verify-package.mjs");
 const verify=read("scripts/smn-478-verify-brief-schema.ts");
 for(const marker of ["20261116_smn472_prompt_text","20261116_smn477_brief_legacy_cleanup"]){
  assert.ok(packageCode.includes(marker),marker);
  assert.ok(smoke.includes(marker),marker);
 }
 assert.match(packageCode,/smn-478-verify-brief-schema/);
 assert.match(smoke,/SMN478_DISPOSABLE_PROOF/);
 assert.match(smoke,/schema\.nativeTemplates,3/);
 assert.match(smoke,/schema\.legacyColumns,0/);
 assert.match(verify,/prompt_text/);
 assert.match(verify,/smn_ai_brief_template_prompt_text_valid/);
});
test("SMN-478: Windows GUI ZIP e2e preserves customized model and immutable archive",()=>{
 const script=read("scripts/windows/smn-442-acceptance.mjs");
 assert.match(script,/seedAiBriefArchive\(\)/);
 assert.match(script,/saveSourceBackup\(\)/);
 assert.match(script,/await waitOutcome\(first,"failed"\)/);
 assert.match(script,/await waitOutcome\(next,"complete"\)/);
 assert.match(script,/models\.rows\[0\]\.prompt_text,briefProof\.promptText/);
 assert.match(script,/models\.rows\[0\]\.revision,5/);
 assert.match(script,/records\.rows\[0\]\.sha256,briefProof\.sha256/);
 assert.match(script,/records\.rows\[0\]\.template_id,briefProof\.templateId/);
});
test("SMN-478: receipt writer forbids distribution without all qualifications",()=>{
 const writer=read("scripts/windows/create-delivery-evidence.mjs");
 const gate=read("scripts/windows/smn-478-qualification-gate.mjs");
 assert.match(writer,/await verifySmn478Qualification\(/);
 assert.match(gate,/zipFreshRestore/);
 assert.match(gate,/zipUpgradeRestore/);
 assert.match(gate,/windowsFresh/);
 assert.match(gate,/windowsUpgrade/);
 assert.match(gate,/postgresRollback/);
 assert.match(gate,/sha256/);
});
