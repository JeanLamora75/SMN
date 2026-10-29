import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Rapports : aucun DDL direct dans les services métier",()=>{
 for(const file of readdirSync(new URL("../src/server/reports/",import.meta.url)).filter(f=>f.endsWith(".ts"))){
  const source=read("src/server/reports/"+file);
  assert.doesNotMatch(source,/\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|VIEW)\b/i,file);
 }
});
test("Rapports : migration additive transactionnelle pour les 17 définitions extraites",()=>{
 const source=read("scripts/apply-report-schema-v32.ts");
 assert.match(source,/pg_advisory_xact_lock/);
 assert.match(source,/ROLLBACK/);
 assert.match(source,/schema_version!==32/);
 assert.match(source,/smn_report_document_create_request_idx/);
 assert.match(source,/smn_report_archive_grant/);
 assert.doesNotMatch(source,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
});
