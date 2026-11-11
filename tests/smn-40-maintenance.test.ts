import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {parseMaintenanceArgs} from "../scripts/smn-40-maintenance";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SMN-40 maintenance is check-only by default and requires explicit dual approval",()=>{
 assert.equal(parseMaintenanceArgs(["--check"]),"check");
 assert.equal(parseMaintenanceArgs(["--apply","--confirm=INSTALL_SENSITIVE_PRIVACY_GUARDS",
  "--backup-verified=YES"]),"apply");
 for(const args of [[],["--apply"],["--check","--apply"],
  ["--apply","--backup-verified=YES"],
  ["--apply","--confirm=INSTALL_SENSITIVE_PRIVACY_GUARDS"],
  ["--apply","--confirm=INSTALL_SENSITIVE_PRIVACY_GUARDS","--backup-verified=NO"]]){
  assert.throws(()=>parseMaintenanceArgs(args),/maintenance-arguments-invalid/);
 }
});
test("SMN-40 guards are additive, ordered and require a rollback-able transaction",()=>{
 const script=read("scripts/smn-40-maintenance.ts");
 assert.match(script,/20261109_smn39_privacy_receipt[\s\S]+20261109_smn39_archive_restriction[\s\S]+20261109_smn40_member_delete_guard/);
 assert.match(script,/await db\.query\("BEGIN"\)/);
 assert.match(script,/await db\.query\("ROLLBACK"\)/);
 assert.match(script,/maintenance-postcheck-failed/);
 assert.match(script,/BEGIN READ ONLY/);
 for(const migration of [
  "20261109_smn39_privacy_receipt",
  "20261109_smn39_archive_restriction",
  "20261109_smn40_member_delete_guard"]){
  const sql=read("prisma/migrations/"+migration+"/migration.sql");
  assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|DELETE FROM/i);
 }
});
