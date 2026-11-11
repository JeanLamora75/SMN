import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

describe("Rapprochement des statuts Scrum multi-equipes",()=>{
 const service=read("src/server/sprints/scoped-state-reconciliation.ts");
 const endpoint=read("src/app/api/sprints/reconcile/route.ts");
 const index=read("src/server/sprints/index.ts");
 const reader=read("src/server/sprints/read-only-db.ts");
 const ui=read("src/app/app/admin/sprints/sprint-index-view.tsx");

 it("protège la mutation par authentification admin, origine et équipe résolue",()=>{
  assert.match(endpoint,/authorizeApi\(request,"write"/);
  assert.match(endpoint,/actor\.role!=="admin"/);
  assert.match(endpoint,/readJsonObject\(request\)/);
  assert.match(service,/resolveAdminTeam\(db,actor,requestedTeamId\)/);
  assert.match(service,/team\.mode!=="scrum"/);
  assert.match(service,/team_id=\$1/g);
 });
 it("applique les transitions sous transaction avec verrou par équipe",()=>{
  assert.match(service,/await db\.query\("BEGIN"\)/);
  assert.match(service,/pg_advisory_xact_lock\(hashtext\(\$1\)\)/);
  assert.match(service,/await db\.query\("COMMIT"\)/);
  assert.match(service,/await db\.query\("ROLLBACK"\)/);
  assert.match(service,/ON CONFLICT \(sprint_id,transition\) DO NOTHING/g);
  assert.match(service,/ON CONFLICT \(sprint_id\) DO NOTHING/);
 });
 it("active les sprints ouverts et termine les sprints dépassés sans clôture implicite",()=>{
  assert.match(service,/status='planned' AND start_at<=now\(\) AND end_at>now\(\)/);
  assert.match(service,/status IN \('planned','active'\) AND end_at<=now\(\)/);
  assert.match(service,/SET status='active'/);
  assert.match(service,/SET status='finished'/);
  assert.doesNotMatch(service,/SET status='closed'/);
 });
 it("exclut sprints supprimés, suspendus et historiques clôturés",()=>{
  assert.match(service,/deleted_at IS NULL AND auto_suspended=false/g);
  assert.doesNotMatch(service,/status IN \('finished','closed'\)/);
 });
 it("garde la consultation et la pagination en lecture seule",()=>{
  assert.match(reader,/BEGIN READ ONLY/);
  assert.doesNotMatch(index,/reconcileScopedSprintStates/);
  assert.match(ui,/fetch\("\/api\/sprints\/reconcile"/);
  assert.match(ui,/method:"POST"/);
  assert.match(ui,/fetch\("\/api\/sprints\/index\?"/);
 });
});
