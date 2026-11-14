import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import en from "../src/i18n/en.json";
import fr from "../src/i18n/fr.json";

const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const form=read("src/app/app/admin/sprints/work-slots-form.tsx");
const route=read("src/app/api/admin/sprints/work-slots/route.ts");
const resolver=read("src/server/teams/resolve.ts");

test("team picker is always visible, even when only one Scrum team exists",()=>{
 assert.match(form,/<div className="mb-3"><label className="form-label" htmlFor="slot-team">/);
 assert.doesNotMatch(form,/teams\.length>1&&<div className="mb-3"/);
 assert.match(form,/teams\.map\(team=><option key=\{team\.id\} value=\{team\.id\}>/);
 assert.match(form,/const soleTeamId=teams\.length===1\?teams\[0\]\.id:null/);
 assert.match(form,/lastAutoLoadedTeam\.current===soleTeamId/);
 assert.match(form,/setTeamId\(soleTeamId\);void load\(soleTeamId\)/);
 assert.match(form,/load\(id\)/);
});
test("explicit selected team bypasses potentially stale account preference",()=>{
 assert.match(resolver,/requestedTeamId==null\?await db\.query/);
 assert.match(resolver,/let id=requestedTeamId\?\?chosen\.rows\[0\]\?\.team_id/);
 assert.match(form,/encodeURIComponent\(selectedTeamId\)/);
 assert.match(form,/JSON\.stringify\(\{\.\.\.slots,timeZone:zone,revision,teamId\}\)/);
});
test("team selection and database errors are distinguishable and translated",()=>{
 for(const error of ["work-slots-schema-unavailable","scrum-team-unavailable","team-context-unavailable"]){
  assert.ok(route.includes(error),error);
 }
 for(const key of ["schemaUnavailable","notScrum","teamUnavailable","loadError"] as const){
  assert.ok(en.epic4WorkSlots[key],key);assert.ok(fr.epic4WorkSlots[key],key);
  assert.ok(form.includes("epic4WorkSlots."+key),key);
 }
});
