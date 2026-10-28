import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const page=readFileSync(new URL("../src/app/app/admin/sprints/[sprintId]/page.tsx",import.meta.url),"utf8");

test("la fiche Sprint utilise le contexte équipe authentifié sur les schémas multiéquipes",()=>{
 assert.match(page,/readAccountDashboard\(db,/);
 assert.match(page,/accountId:account\.id,role:account\.role/);
 assert.match(page,/requested\.teamId/);
 assert.doesNotMatch(page,/withAuthDb\(readCollectiveDashboard\)/);
 assert.match(page,/readSprintContext\(db,teamId\)/);
 assert.match(page,/context\.items\.find\(item=>item\.id===sprintId\)/);
});
