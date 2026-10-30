import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const creator=read("src/server/sprints/historical-create.ts");
const api=read("src/app/api/admin/sprints/historical/route.ts");
const page=read("src/app/app/admin/sprints/historical/page.tsx");
const form=read("src/app/app/admin/sprints/historical/historical-sprint-form.tsx");

test("v32 : historique de Sprint résout une équipe Scrum autorisée et non archivée",()=>{
 assert.match(creator,/resolveAdminTeam\(db,\{accountId:actorId,role:"admin"\},requestedTeamId\)/);
 assert.match(creator,/scope\.mode!=="scrum"/);
 assert.match(creator,/t\.id=\$1/);
 assert.match(creator,/to_jsonb\(t\)->>'agile_mode'/);
 assert.match(creator,/to_jsonb\(t\)->>'is_archived'/);
 assert.doesNotMatch(creator,/lower\(i\.mode\)/i);
});
test("v32 : route et formulaire transmettent le contexte équipe et expliquent son refus",()=>{
 assert.match(page,/HistoricalSprintForm teamId=/);
 assert.match(api,/req\.nextUrl\.searchParams\.get\("teamId"\)/);
 assert.match(form,/new URLSearchParams\(\{teamId\}\)/);
 assert.match(form,/json\.error==="team-unavailable"/);
});
test("v32 : création historique conserve verrou, anti-chevauchement et audit atomique",()=>{
 assert.match(creator,/pg_advisory_xact_lock/);
 assert.match(creator,/start_at<\$3::timestamptz AND end_at>\$2::timestamptz/);
 assert.match(creator,/INSERT INTO public\.smn_sprint_historical_request/);
 assert.match(creator,/INSERT INTO public\.smn_sprint_audit/);
 assert.match(creator,/ROLLBACK/);
});
