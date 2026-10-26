import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {MULTI_TEAM_SCHEMA_SQL} from "../src/server/teams/migration";
import {MULTI_TEAM_CONTEXT_READY} from "../src/lib/team-context-readiness";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("verrou global fermé tant que les consommateurs monoéquipe ne sont pas migrés",()=>{
 assert.equal(MULTI_TEAM_CONTEXT_READY,false);
 const layout=source("src/app/app/layout.tsx");
 assert.match(layout,/teamSwitcherEnabled=\{MULTI_TEAM_CONTEXT_READY&&account\.role==="admin"\}/);
 const route=source("src/app/api/admin/teams/active/route.ts");
 assert.match(route,/if\(!MULTI_TEAM_CONTEXT_READY\)/);
 assert.match(route,/authorizeApi\(request,"write",settings\)/);
 assert.match(route,/readJsonObject\(request,512\)/);
});
test("préférence stockée par compte sans attribuer de droit user",()=>{
 assert.match(MULTI_TEAM_SCHEMA_SQL,/CREATE TABLE public\.smn_account_team_preference/);
 assert.match(MULTI_TEAM_SCHEMA_SQL,/account_id text PRIMARY KEY/);
 assert.match(MULTI_TEAM_SCHEMA_SQL,/FOREIGN KEY\(account_id,installation_id\)/);
 assert.match(MULTI_TEAM_SCHEMA_SQL,/FOREIGN KEY\(team_id,installation_id\)/);
 assert.match(MULTI_TEAM_SCHEMA_SQL,/WHERE a\.role='admin' AND a\.is_active=true/);
 const schema=source("prisma/schema.prisma");
 assert.match(schema,/model SmnAccountTeamPreference/);
 const sql=source("prisma/migrations/20261026_smn282_multi_teams/migration.sql");
 assert.equal(sql,MULTI_TEAM_SCHEMA_SQL);
});
test("lecture et écriture côté serveur filtrées par installation et rôle",()=>{
 const active=source("src/server/teams/active.ts");
 assert.match(active,/a\.role='admin'/);
 assert.match(active,/a\.is_active=true/);
 assert.match(active,/team\.rows\.length!==1/);
 assert.match(active,/SELECT id FROM public\.smn_team WHERE id=\$1 AND installation_id=\$2/);
 assert.match(active,/ROLLBACK/);
});
test("en-tête partage l'identité du contrôle avec l'existant, et préserve les brouillons",()=>{
 const selector=source("src/app/app/active-team-selector.tsx");
 assert.match(selector,/id="smn-current-team"/);
 assert.match(selector,/data-smn-unsaved-changes/);
 assert.match(selector,/teamSwitchDestination/);
 assert.match(selector,/router\.replace/);
 for(const file of [
  "src/app/app/admin/settings/teams/teams-settings.tsx",
  "src/app/app/admin/members/team-context-editor.tsx"
 ])assert.match(source(file),/data-smn-unsaved-changes/);
});
