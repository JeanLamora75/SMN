import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const api=read("src/app/api/admin/members/[id]/team-profile/route.ts");
const editor=read("src/app/app/admin/members/[id]/member-team-profile-editor.tsx");
const cockpit=read("src/app/app/admin/members/[id]/member-team-read-only.tsx");
test("fiche v32 : identité modifiable depuis le cockpit",()=>{
 assert.match(cockpit,/Modifier le profil/);
 assert.match(cockpit,/MemberTeamProfileEditor/);
 assert.match(editor,/method:"PATCH"/);
 assert.match(editor,/revision:profile.revision/);
});
test("API : rôle admin, périmètre membre-équipe et verrou de révision",()=>{
 assert.match(api,/actor.role!=="admin"/);
 assert.match(api,/authorizeApi\(req,"write",resource\)/);
 assert.ok((api.match(/requireTeamMemberScope\(/g)||[]).length>=2);
 assert.match(api,/FOR UPDATE/);
 assert.match(api,/m.revision!==revision/);
 assert.match(api,/m.archived_at/);
});
test("API : transaction et audit d'identité conservés",()=>{
 assert.match(api,/await db.query\("BEGIN"\)/);
 assert.match(api,/smn_member_identity_history/);
 assert.match(api,/await db.query\("COMMIT"\)/);
 assert.match(api,/await db.query\("ROLLBACK"\)/);
});
