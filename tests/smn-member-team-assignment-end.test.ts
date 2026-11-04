import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {parseTeamAssignmentEnd,correctTeamAssignmentEnd} from "../src/server/members/team-assignment-end";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const valid={teamId:"team_koala",assignmentId:"123e4567-e89b-42d3-a456-426614174000",
 endOn:"2026-12-31",reason:"changement d'équipe",revision:4,latestRevision:2};

test("fin d'affectation : entrée stricte avec date et motif facultatif",()=>{
 assert.deepEqual(parseTeamAssignmentEnd(valid),valid);
 assert.equal(parseTeamAssignmentEnd({...valid,reason:null})?.reason,null);
 assert.equal(parseTeamAssignmentEnd({...valid,reason:"  "})?.reason,null);
 for(const invalid of [
  {...valid,endOn:"2026-02-30"},{...valid,teamId:"../x"},
  {...valid,assignmentId:"other"},{...valid,revision:-1},
  {...valid,latestRevision:0},{...valid,extra:"secret"},
  {...valid,reason:"x".repeat(201)}
 ])assert.equal(parseTeamAssignmentEnd(invalid),null);
});

test("fin d'affectation : isolation équipe, verrou, conflit et audit sans archivage",()=>{
 const service=read("src/server/members/team-assignment-end.ts");
 assert.match(service,/resolveAdminTeam\(db,actor,input\.teamId\)/);
 assert.match(service,/id=\$1 AND member_id=\$2 AND team_id=\$3 FOR UPDATE/);
 assert.match(service,/member\.rows\[0\]\.revision!==input\.revision/);
 assert.match(service,/latest\.revision!==input\.latestRevision/);
 assert.match(service,/input\.endOn<row\.start_on/);
 assert.doesNotMatch(service,/input\.endOn<latest\.effective_from/);
 assert.doesNotMatch(service,/future-version/);
 assert.match(service,/UPDATE public\.smn_member_assignment SET end_on/);
 assert.match(service,/INSERT INTO public\.smn_member_lifecycle_event/);
 assert.match(service,/VALUES\(\$1,\$2,\$3,'close'/);
 assert.doesNotMatch(service,/SET archived_at/);
 assert.match(service,/ROLLBACK/);
});

test("fin d'affectation : formulaire et API réservés à l'équipe",()=>{
 const ui=read("src/app/app/admin/members/assignment-editor.tsx");
 const api=read("src/app/api/admin/members/[id]/team-assignment/end/route.ts");
 const get=read("src/app/api/admin/members/[id]/team-assignment/route.ts");
 assert.match(ui,/teamScoped&&state\.assignmentId&&state\.startOn/);
 assert.match(ui,/Date de fin d(?:'|&apos;)affectation/);
 assert.match(ui,/Motif de sortie \(facultatif\)/);
 assert.match(ui,/team-assignment\/end/);
 assert.match(ui,/latestRevision:state\.latestRevision/);
 assert.match(get,/endOn:latest\.endOn/);
 assert.match(api,/actor\.role!=="admin"/);
 assert.match(api,/endTeamAssignment\(db,/);
});

test("SMN-45 : une sortie avant la dernière révision datée reste autorisée",()=>{
 const service=read("src/server/members/team-assignment-end.ts");
 const editor=read("src/app/app/admin/members/assignment-editor.tsx");
 assert.match(service,/if\(input\.endOn<row\.start_on\)return fail\("invalid-date"\)/);
 assert.match(service,/latest\.revision!==input\.latestRevision/);
 assert.match(service,/member\.rows\[0\]\.revision!==input\.revision/);
 assert.doesNotMatch(service,/if\(input\.endOn<latest\.effective_from\)/);
 assert.match(editor,/min=\{state\.startOn\}/);
 assert.doesNotMatch(editor,/min=\{state\.versions\.at\(-1\)/);
 assert.match(editor,/if\(!endOn\|\|endOn<state\.startOn\)/);
});

test("SMN-45 : correction d'une affectation clôturée, sans suppression de l'audit précédent",()=>{
 const service=read("src/server/members/team-assignment-end.ts");
 const route=read("src/app/api/admin/members/[id]/team-assignment/end/route.ts");
 const get=read("src/app/api/admin/members/[id]/team-assignment/route.ts");
 const calendar=read("src/server/members/team-availability-window.ts");
 assert.equal(typeof correctTeamAssignmentEnd,"function");
 assert.match(route,/export async function PATCH/);
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(route,/correctTeamAssignmentEnd\(db,/);
 assert.match(service,/row\.end_on!==value\.expectedEndOn/);
 assert.match(service,/input\.endOn<row\.start_on/);
 assert.match(service,/latestRevision/);
 assert.match(service,/start_on<=\$4::date AND \(end_on IS NULL OR end_on>=\$5::date\)/);
 assert.match(service,/correction:true,previousEndOn:row\.end_on,previousReason/);
 assert.match(service,/INSERT INTO public\.smn_member_lifecycle_event/);
 assert.doesNotMatch(service,/DELETE FROM public\.smn_member_lifecycle_event/);
 assert.match(get,/endReason:closing\?\.rows\[0\]\?\.reason\?\?null/);
 assert.match(calendar,/ORDER BY e\.occurred_at DESC,e\.id DESC LIMIT 1/);
});

test("SMN-45 : une date et un motif clôturés restent éditables et le calendrier s'actualise",()=>{
 const editor=read("src/app/app/admin/members/assignment-editor.tsx");
 const calendar=read("src/app/app/admin/members/[id]/member-team-read-only.tsx");
 assert.match(editor,/setEndReason\(data\.endReason\?\?""\)/);
 assert.match(editor,/method:state\.endOn\?"PATCH":"POST"/);
 assert.match(editor,/expectedEndOn:state\.endOn/);
 assert.match(editor,/state\.endOn\?"Corriger la fin d’affectation"/);
 assert.match(editor,/min=\{state\.startOn\}/);
 assert.doesNotMatch(editor,/state\.endOn\?<p className="mb-0">Affectation terminée/);
 assert.match(calendar,/\[memberId,teamId,month,refreshKey\]/);
});
