import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("la lecture des absences est filtrée en SQL avant chargement",()=>{
 const source=readFileSync("src/server/members/team-absence-read.ts","utf8");
 assert.ok(!source.includes("readMemberAbsences("));
 assert.ok(source.includes("requireTeamMemberScope("));
 assert.ok(source.includes("own.team_id=$2"));
 assert.ok(source.includes("other.team_id<>$2"));
 assert.ok(source.includes("LIMIT 501"));
 assert.ok(source.includes("member-absence-history-limit"));
});
