import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("member cockpit: add/manage entry is localized and opens absence management",()=>{
 const page=read("src/app/app/admin/members/[id]/member-team-read-only.tsx");
 const fr=JSON.parse(read("src/i18n/fr.json"));
 const en=JSON.parse(read("src/i18n/en.json"));
 assert.equal(fr.memberAbsences.openManage,"Ajouter/Gérer Absence");
 assert.equal(en.memberAbsences.openManage,"Add/Manage Absences");
 assert.match(page,/t\("memberAbsences\.openManage"\)/);
 assert.match(page,/onClick=\{\(\)=>setEditor\("absence"\)\}/);
 assert.match(page,/useLocale/);
});
test("member absence dialog: half-day slots are translated and future records are highlighted first",()=>{
 const src=read("src/app/app/admin/members/member-absence-editor.tsx");
 const css=read("src/app/app/admin/members/[id]/member-cockpit.css");
 assert.match(src,/const slotLabel=\(slot:AbsenceSlot\)=>t\(slot==="morning"\?"members\.calendar\.morning":"members\.calendar\.afternoon"\)/);
 assert.doesNotMatch(src,/\{item\.startSlot\} → \{item\.endSlot\}/);
 assert.match(src,/activeAbsences\.filter\(item=>item\.endOn>=today\)/);
 assert.match(src,/activeAbsences\.filter\(item=>item\.endOn<today\)/);
 assert.ok(src.indexOf('id:"upcoming"')<src.indexOf('id:"past"'));
 assert.match(src,/smn-absence-row--upcoming/);
 assert.match(css,/smn-absence-row--upcoming/);
 assert.match(css,/smn-absence-row--past/);
});
test("member absence dialog: accessible icon-only edit/delete and preserved confirmation",()=>{
 const src=read("src/app/app/admin/members/member-absence-editor.tsx");
 assert.match(src,/<BootstrapIcon name="pencil-square"\/>/);
 assert.match(src,/<BootstrapIcon name="trash"\/>/);
 assert.match(src,/aria-label=\{t\("members\.absence\.edit"\)/);
 assert.match(src,/aria-label=\{t\("memberAbsences\.delete"\)/);
 assert.match(src,/deleteExisting\(item\)/);
 assert.match(src,/window\.confirm\(t\("memberAbsences\.cancelConfirm"/);
});
