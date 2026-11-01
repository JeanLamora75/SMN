import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("SMN-347 grants are explicit and revocable",()=>{
 const sql=read("prisma/migrations/20261101_smn347_team_grants/migration.sql");
 const grant=read("src/server/indicators/team-access.ts");
 const catalog=read("src/server/indicators/catalog.ts");
 const route=read("src/app/api/admin/indicators/catalog/route.ts");
 assert.match(sql,/PRIMARY KEY\(installation_id,account_id,team_id\)/);
 assert.match(grant,/EXISTS/);assert.match(grant,/can_manage=true/);
 assert.match(grant,/DELETE FROM public.smn_indicator_team_grant/);
 assert.match(catalog,/requireIndicatorTeam/);
 assert.match(route,/sessionAccount/);
});
