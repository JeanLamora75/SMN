import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {assertLegacyTeamApi} from "../src/server/teams/legacy";
import {teamSwitchDestination} from "../src/lib/team-navigation";

const legacyRoutes=[
 "src/app/api/admin/sprints/scores/route.ts",
 "src/app/api/admin/sprints/story-points/route.ts",
 "src/app/api/admin/sprints/goals/route.ts",
 "src/app/api/admin/sprints/tickets/route.ts",
 "src/app/api/admin/sprints/delete/route.ts",
 "src/app/api/admin/sprints/reschedule/route.ts",
 "src/app/api/admin/sprints/ceremonies/[id]/route.ts",
 "src/app/api/admin/sprints/exceptional-meetings/route.ts",
 "src/app/api/admin/sprints/attendance/route.ts",
 "src/app/api/admin/sprints/historical-events/[id]/route.ts",
 "src/app/api/admin/sprints/[id]/route.ts",
 "src/app/api/admin/sprints/wizard/confirm/route.ts",
 "src/app/api/admin/sprints/work-slots/route.ts"
];
test("routes historiques sensibles passent par le garde de schema",()=>{
 for(const file of legacyRoutes){
  const source=readFileSync(file,"utf8");
  assert.match(source,/withLegacyTeamApi\(/,file);
  assert.doesNotMatch(source,/withAuthDb\(/,file);
 }
 const qualitative=readFileSync("src/app/api/admin/sprints/qualitative-versions/route.ts","utf8");
 assert.match(qualitative,/assertLegacyTeamApi\(db\)/);
});
test("garde monoéquipe accepte v27 et refuse v28 v29 et schéma absent",async()=>{
 for(const version of [27,28,29,null]){
  const db={query:async()=>({rows:version===null?[]:[{schema_version:version}]})} as unknown as Client;
  if(version===27)await assert.doesNotReject(()=>assertLegacyTeamApi(db));
  else await assert.rejects(()=>assertLegacyTeamApi(db),/team-api-context-isolation-pending/);
 }
});
test("changer d'équipe ne transporte jamais le contexte de l'ancienne équipe",()=>{
 const uri=teamSwitchDestination("/app/admin/sprints/old?cycleId=old&filter=urgent","team_b","scrum");
 assert.equal(uri,"/app?teamId=team_b");
});
