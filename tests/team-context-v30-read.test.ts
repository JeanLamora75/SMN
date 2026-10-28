import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("lecture fiche équipe v30: identité Admin et teamId serveur",()=>{
 const route=readFileSync(new URL("../src/app/api/admin/team-context/route.ts",import.meta.url),"utf8");
 const get=route.slice(route.indexOf("export async function GET"),route.indexOf("export async function PATCH"));
 assert.match(get,/resolveRegistryReadContext\(db,/);
 assert.match(get,/accountId:actor\.id,role:actor\.role/);
 assert.match(get,/context\.team\?\.team_id!==teamId/);
 assert.match(get,/readTeamContext\(db,teamId\)/);
});
test("les changements de contexte ne contournent pas le verrou historique",()=>{
 const route=readFileSync(new URL("../src/app/api/admin/team-context/route.ts",import.meta.url),"utf8");
 const patch=route.slice(route.indexOf("export async function PATCH"));
 assert.match(patch,/withLegacyTeamApi\(db=>saveTeamContext/);
});

test("contexte v30: mode de l'équipe et équipes archivées",()=>{
 const service=readFileSync(new URL("../src/server/members/team-context.ts",import.meta.url),"utf8");
 assert.match(service,/i\.schema_version IN \(28,29,30\)/);
 assert.match(service,/to_jsonb\(t\)->>'agile_mode'/);
 assert.match(service,/to_jsonb\(t\)->>'is_archived'/);
});
