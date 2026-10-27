import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("la lecture SQL des cérémonies ne contient pas d'antislash-n littéral",()=>{
 const s=readFileSync("src/server/sprints/calendar-meeting-detail.ts","utf8");
 assert.ok(s.includes("s.team_id=$2"));
 assert.ok(!s.includes(String.raw`\n   AND`));
 assert.ok(!s.includes(String.raw`\n   LIMIT`));
});
test("les paramètres UPDATE Kanban et Scrum sont alignés",()=>{
 const s=readFileSync("src/server/teams/meeting-change.ts","utf8");
 assert.ok(s.includes("starts_at=$${scrum?6:5}"));
 assert.ok(s.includes("ends_at=$${scrum?7:6}"));
 assert.ok(s.includes("const argumentsSql=scrum?"));
 assert.ok(s.includes("db.query(query,argumentsSql)"));
});
