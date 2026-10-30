import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const view=read("src/app/app/admin/members/[id]/member-team-read-only.tsx");
const editor=read("src/app/app/admin/members/assignment-editor.tsx");
const css=read("src/app/app/admin/members/[id]/member-cockpit.css");
test("affectation : titre unique dans le bandeau bleu du dialogue",()=>{
 assert.match(view,/editor==="assignment"\?<AssignmentEditor/);
 assert.match(view,/smn-cockpit-modal-header/);
 assert.doesNotMatch(editor,/<h3 className="h5" id="assignment-heading"/);
});
test("les deux actions sont primaires et bleu Cockpit Agile",()=>{
 assert.match(editor,/className="btn btn-primary smn-member-assignment-historical-action"/);
 assert.match(editor,/className="btn btn-primary"/);
 assert.match(css,/\.smn-member-edit-dialog \.smn-cockpit-modal-body \.btn-primary:not\(:disabled\)/);
 assert.match(css,/background:#1b508d;border-color:#1b508d/);
});
test("modale accessible et adaptée aux hauteurs restreintes",()=>{
 assert.match(view,/<dialog ref=\{dialogRef\}/);
 assert.match(css,/max-height:min\(90vh,900px\)/);
 assert.match(css,/\.smn-member-edit-dialog \.smn-cockpit-modal-header\{position:sticky/);
 assert.match(css,/@media\(max-width:550px\)/);
});
