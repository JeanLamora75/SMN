import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("le suivi des cérémonies refuse les historiques manquants sans DDL",()=>{
 const s=readFileSync("src/server/teams/ceremony-attendance.ts","utf8");
 assert.ok(s.includes("to_regclass('public.smn_sprint_ceremony_status_history')"));
 assert.ok(s.includes("to_regclass('public.smn_meeting_actual_duration_audit')"));
 assert.ok(s.includes('return reject("storage-unavailable")'));
 assert.ok(!s.includes("CREATE TABLE"));
 assert.ok(!s.includes("ALTER TABLE"));
});
test("la création des comptes rendus verrouille une seule fois le sprint",()=>{
 const s=readFileSync("src/server/teams/ceremony-outcomes-create.ts","utf8");
 assert.equal(s.split('if(sprint.rows.length!==1)').length-1,1);
 assert.ok(s.includes("FOR UPDATE OF s,c"));
});
