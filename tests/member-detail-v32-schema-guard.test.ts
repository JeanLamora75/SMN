import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const page=readFileSync(new URL("../src/app/app/admin/members/[id]/page.tsx",import.meta.url),"utf8");

test("fiche membre : accès contextualisé v28 à la version courante",()=>{
 assert.match(page,/evaluateSchemaCapability\(schema,"multi-team"\)\.ok/);
 assert.match(page,/actor\.role!=="admin"/);
 assert.doesNotMatch(page,/schema>32/);
 assert.doesNotMatch(page,/schema!==28/);
 assert.match(page,/resolveAdminTeam\(db,/);
 assert.match(page,/readTeamAssignmentHistory\(db,/);
});
test("fiche membre : pas de repli sur une fiche personnelle non contextualisée",()=>{
 assert.match(page,/schema>=1&&schema<=27/);
 assert.match(page,/if\(context\.kind==="legacy"\)/);
 assert.match(page,/if\(explicitTeamId===""\)/);
 assert.match(page,/person\.rows\.length!==1/);
 assert.match(page,/a\.team_id=\$2/);
 assert.match(page,/context\.kind==="team"\?<MemberTeamReadOnly/);
});
