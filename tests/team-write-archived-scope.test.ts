import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("capacité réelle : verrou et exclusion des équipes archivées",()=>{
 const src=file("src/server/capacity/team-actual-write.ts");
 assert.match(src,/to_jsonb\(t\).*is_archived/);
 assert.match(src,/FOR UPDATE/);
 assert.match(src,/resolveAdminTeam\(db,actor,teamId\)/);
});
test("répartition des rôles : mise à jour réservée aux équipes actives",()=>{
 const src=file("src/server/members/team-assignment-write.ts");
 assert.match(src,/to_jsonb\(t\).*is_archived/);
 assert.match(src,/a\.team_id=\$2 AND a\.end_on IS NULL/);
 assert.match(src,/resolveAdminTeam\(db,actor,input\.teamId\)/);
});
