import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("src/app/app/admin/settings/working-days/page.tsx");
const form=read("src/app/app/admin/sprints/work-slots-form.tsx");
const route=read("src/app/api/admin/sprints/work-slots/route.ts");
const resolver=read("src/server/teams/resolve.ts");

test("work hours settings supplies Scrum teams and loads explicit team context",()=>{
 assert.match(page,/WorkSlotsForm teams=\{scrumTeams\}/);
 assert.match(page,/agile_mode/);
 assert.match(form,/teams\.length===1/);
 assert.match(form,/teamId="\+encodeURIComponent\(selectedTeamId\)/);
 assert.match(form,/id="slot-team"/);
 assert.match(form,/teamId\}\)/);
 assert.match(route,/getTeamSlots\(db,\{accountId:actor\.id,role:actor\.role\},req\.nextUrl\.searchParams\.get\("teamId"\)\)/);
 assert.match(resolver,/requestedTeamId\?\?chosen\.rows\[0\]\?\.team_id/);
});
test("load errors, reload and conflict messages are translated into English",()=>{
 const keys=["team","selectTeam","selectTeamRequired","teamUnavailable","forbidden","loadError","networkError","reload","conflict","invalid","saveError"] as const;
 for(const key of keys){assert.ok(fr.epic4WorkSlots[key]);assert.ok(en.epic4WorkSlots[key]);}
 assert.equal(en.epic4WorkSlots.reload,"Reload work hours");
 assert.doesNotMatch(form,/Impossible de charger les horaires|Recharger les horaires|Aucune équipe active/);
 assert.match(form,/epic4WorkSlots\.loadError/);
 assert.match(form,/t\("epic4WorkSlots\.reload"\)/);
});
test("save preserves explicit scope, time fields, revision and avoids overwriting unloaded data",()=>{
 assert.match(form,/JSON\.stringify\(\{\.\.\.slots,timeZone:zone,revision,teamId\}\)/);
 assert.match(form,/!teamId\|\|!original/);
 assert.match(form,/response\.status===409/);
 assert.match(form,/setOriginal\(\{slots:\{\.\.\.slots\},zone\}\)/);
});
