import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SMN-34 — preflight strictement non destructif, garde les autorisations et refuse l'exécution",()=>{
 const route=read("src/app/api/admin/backups/restore/preflight/route.ts");
 assert.match(route,/authorizeApi\(request,"write",\{type:"backups",exists:true,inScope:true\}\)/);
 assert.match(route,/currentErasureEvidence\(preview\.archive\.createdAt\?\?undefined,db\)/);
 assert.match(route,/assessRestoreGate\(preview,evidence\)/);
 assert.match(route,/jsonResult\(\{preview,gate:assessRestoreGate\(preview,evidence\)\},409\)/);
 assert.doesNotMatch(route,/import .* from ".*(?:restore-sandbox|restore-cutover-drill|restore-coordinated-drill)"/);
 assert.doesNotMatch(route,/\b(?:spawn|rename|rm|rehearseBackupRestore)\(/);
});
test("SMN-34 — les risques et refus sont tous internationalisés",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).backups;
 const en=JSON.parse(read("src/i18n/en.json")).backups;
 for(const locale of [fr,en]){
  for(const key of ["archive-not-verified","archive-scope-incomplete","archive-identity-mismatch",
   "different-installation","schema-incompatible","postgres-incompatible",
   "application-incompatible","current-documents-unavailable","archive-date-unavailable",
   "privacy-erasures-unverified","privacy-erased-data","privacy-coverage-gap",
   "isolated-restore-unverified","rollback-checkpoint-unverified",
   "atomic-cutover-unverified","session-reset-unverified"]){
   assert.equal(typeof locale.restoreGate[key],"string",key);
   assert.ok(locale.restoreGate[key].trim().length>0,key);
  }
  assert.equal(typeof locale.restoreWarningsTitle,"string");
  assert.equal(typeof locale.restoreWarnings["potential-data-loss"],"string");
  const issues=["archive-not-verified","source-unconfirmed","different-installation",
   "schema-newer","schema-older","postgres-incompatible","application-incompatible",
   "privacy-not-cleared","current-documents-unavailable","current-unavailable"];
  for(const issue of issues)assert.equal(typeof locale.previewIssues[issue],"string",issue);
 }
 const ui=read("src/app/app/admin/backups/backups-admin.tsx");
 assert.match(ui,/blocker\.startsWith\("preview-"\)/);
 assert.match(ui,/backups\.previewIssues\./);
 assert.match(ui,/backups\.restoreWarnings\./);
 assert.doesNotMatch(ui,/dangerouslySetInnerHTML/);
});
test("SMN-34 — qualification ne débloque ni contrôle vie privée ni activation serveur",()=>{
 const privacy=read("src/server/backup/erasure-protection.ts");
 const gate=read("src/server/backup/restore-readiness.ts");
 assert.match(privacy,/completeHistory:false/);
 assert.match(gate,/blockers\.add\("isolated-restore-unverified"\)/);
 assert.match(gate,/blockers\.add\("rollback-checkpoint-unverified"\)/);
 assert.match(gate,/blockers\.add\("atomic-cutover-unverified"\)/);
 assert.match(gate,/blockers\.add\("session-reset-unverified"\)/);
});
