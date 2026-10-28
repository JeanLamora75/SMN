import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";

const source=readFileSync(new URL("../src/server/holidays/preload.ts",import.meta.url),"utf8");

describe("Pays — garde du rafraîchissement annuel",()=>{
 it("sérialise le rafraîchissement avec les opérations de cycle de vie",()=>{
  assert.match(source,/pg_advisory_xact_lock\(20261021,49\)/);
  assert.match(source,/pg_advisory_xact_lock\(20261021,50\)/);
  assert.match(source,/pg_advisory_xact_lock\(20261026,279\)/);
  assert.match(source,/FROM public\.smn_country WHERE code=\$1 FOR UPDATE/);
  assert.match(source,/country-archived/);
 });
 it("invalide l'attestation lors d'un changement de couverture",()=>{
  assert.match(source,/revision=CASE WHEN/);
  assert.match(source,/administrative_validated_at=CASE WHEN/);
  assert.match(source,/validated_revision=CASE WHEN/);
  assert.match(source,/IS DISTINCT FROM EXCLUDED\.status/);
 });
});
