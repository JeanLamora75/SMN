import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("période Kanban : aucun accès par identifiant seul en v30",()=>{
 const src=read("src/server/kanban/scoped-period.ts");
 assert.match(src,/resolveAdminTeam\(db,access\.actor,access\.teamId\)/);
 assert.match(src,/p\.team_id=\$2/);
 assert.match(src,/i\.schema_version<=27/);
 assert.match(src,/t\.is_archived=false/);
 assert.match(src,/FOR UPDATE OF p/);
 assert.match(src,/team\?"FOR UPDATE OF p,t"/);
});
test("routes Kanban : équipe vérifiée et écritures verrouillées",()=>{
 const ctx=read("src/server/kanban/route-context.ts");
 assert.match(ctx,/resolveRegistryReadContext\(db,/);
 assert.match(ctx,/!MULTI_TEAM_CONTEXT_READY/);
 assert.match(ctx,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 assert.match(ctx,/requested&&context\.team\.team_id!==requested/);
 assert.match(ctx,/write&&!requested/);
 for(const entry of ["flow","timing","goals"]){
  const src=read("src/app/api/admin/kanban-periods/[id]/"+entry+"/route.ts");
  assert.match(src,/withKanbanRouteTeam\(db,/);
 }
});
for(const entry of ["flow-counts","timing","goals"]){
 test(entry+" : lectures et mutations passent par le contrôle de période",()=>{
  const src=read("src/server/kanban/"+entry+".ts");
  assert.match(src,/scopedKanbanPeriod\(db,/);
  assert.match(src,/access\?:KanbanTeamAccess/);
 });
}
