import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {validateSandboxTarget} from "../src/server/backup/restore-sandbox-policy";
const source="postgresql://smn_ci:secret@127.0.0.1:5432/smn";
const target="postgresql://smn_ci:secret@127.0.0.1:5432/smn_restore_test_abcdef1234";
describe("SMN-34 — cible de restauration uniquement isolée",()=>{
 it("accepte une base locale, distincte et explicitement dédiée au test",()=>{
  assert.equal(validateSandboxTarget(source,target),true);
 });
 it("refuse le nom de la base de travail, même sur le même serveur",()=>{
  for(const unsafe of [
   source,source.replace("/smn","/smn_prod"),
   source.replace("/smn","/postgres"),
   target.replace("smn_restore_test_","smn_"),
   target.replace("127.0.0.1","remote.invalid"),
   target.replace("127.0.0.1","localhost"),
   target.replace(":5432",":5433"),
   target.replace("smn_ci","another_role"),
   target+"?options=-cstatement_timeout%3D0",
   "file:///tmp/smn_restore_test_abcdef1234"
  ])assert.equal(validateSandboxTarget(source,unsafe),false,unsafe);
 });
 it("refuse une URL mal formée ou une cible sans mot de passe",()=>{
  assert.equal(validateSandboxTarget(source,"invalid"),false);
  assert.equal(validateSandboxTarget(source,target.replace(":secret@","@")),false);
 });
});
