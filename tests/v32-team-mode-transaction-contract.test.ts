import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const paths=[
 "src/server/dashboard/notes.ts",
 "src/server/dashboard/event-edit.ts",
 "src/server/sprints/ticket-counts.ts",
 "src/server/sprints/calendar-meeting-reschedule.ts"
] as const;

test("les opérations transactionnelles Scrum utilisent le mode de l'équipe sans accès direct au mode global",()=>{
 for(const path of paths){
  const sql=source(path);
  assert.match(sql,/to_jsonb\(t\)->>'agile_mode'/,path);
  assert.match(sql,/to_jsonb\(i\)->>'mode'/,path);
  assert.doesNotMatch(sql,/\bi\.mode\b/,path);
  assert.match(sql,/db\.query\("BEGIN"\)/,path);
  assert.match(sql,/db\.query\("COMMIT"\)/,path);
  assert.match(sql,/db\.query\("ROLLBACK"\)/,path);
  assert.doesNotMatch(sql,/\bCREATE\s+TABLE\b/i,path);
 }
});
test("le résolveur préserve le mode de l'équipe et la compatibilité historique sans colonne i.mode",()=>{
 const sql=source("src/server/teams/resolve.ts");
 assert.match(sql,/COALESCE\(NULLIF\(to_jsonb\(t\)->>'agile_mode',''\),to_jsonb\(i\)->>'mode'\) AS mode/);
 assert.doesNotMatch(sql,/\bi\.mode\b/);
});
