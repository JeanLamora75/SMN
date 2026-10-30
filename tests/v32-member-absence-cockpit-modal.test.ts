import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const view=readFileSync(new URL("../src/app/app/admin/members/[id]/member-team-read-only.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/app/app/admin/members/[id]/member-cockpit.css",import.meta.url),"utf8");
test("absence : action à droite du sélecteur de mois",()=>{
 const heading=view.slice(view.indexOf('className="smn-member-calendar-heading"'),view.indexOf('</div>',view.indexOf('className="smn-member-calendar-heading"')));
 assert.ok(heading.indexOf('id="smn-member-team-month"')<heading.indexOf('onClick={()=>setEditor("absence")}'));
 assert.ok(heading.includes('className="smn-member-readonly smn-member-month-action"'));
});
test("absence : l'éditeur utilise le même dialogue Cockpit Agile",()=>{
 assert.ok(view.includes('"calendar"|"absence"|null'));
 assert.ok(view.includes('editor==="absence"?<MemberAbsenceEditor'));
 assert.ok(view.includes('onSaved={()=>{setEditor(null);setRefreshKey'));
 assert.ok(!view.includes('editingAbsence'));
 assert.ok(css.includes('.smn-member-edit-dialog .smn-panel'));
});
