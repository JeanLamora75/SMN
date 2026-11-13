import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const page=read("src/app/app/admin/settings/teams/page.tsx");
const shell=read("src/app/app/admin/settings/settings-page-shell.tsx");
const create=read("src/app/app/admin/settings/teams/team-create-button.tsx");
const editor=read("src/app/app/admin/settings/teams/teams-settings.tsx");
const styles=read("src/app/app/admin/settings/teams/teams-settings.css");

test("New team is in the settings hero and emits the modal open action",()=>{
 assert.match(page,/action=\{<TeamCreateButton\/>\}/);
 assert.match(shell,/smn-settings-detail-hero-action/);
 assert.match(create,/window\.dispatchEvent\(new Event\(OPEN_TEAM_EDITOR\)\)/);
 assert.match(editor,/window\.addEventListener\(OPEN_TEAM_EDITOR,openNew\)/);
 assert.doesNotMatch(editor,/btn w-100 mb-3/);
});
test("team editing uses Cockpit Agile modal, protects changes and restores focus",()=>{
 assert.match(editor,/createPortal\(<dialog ref=\{dialogRef\}/);
 assert.match(editor,/dialog\.showModal\(\)/);
 assert.match(editor,/onCancel=\{event=>\{event\.preventDefault\(\);closeTeam\(\);\}\}/);
 assert.match(editor,/smn-teams-settings-modal-header/);
 assert.match(editor,/smn-teams-settings-modal-body/);
 assert.match(editor,/smn-teams-settings-modal-footer/);
 assert.match(editor,/data-smn-unsaved-changes=\{dirty\?"true":"false"\}/);
 assert.match(editor,/if\(dirty&&!window\.confirm\(t\("teamSettings\.confirmDiscard"\)\)\)return/);
 assert.match(editor,/form="smn-teams-settings-form"/);
 assert.match(editor,/openerRef\.current\?\.focus\(\)/);
 for(const term of ["teamSettings.teamName","teamSettings.agileMode","teamSettings.vision","teamSettings.productGoal","settingsCollections.archiveTeam"]){
  assert.ok(editor.includes(term),term);
 }
});
test("filter controls share a responsive row and modal follows the active palette",()=>{
 assert.match(editor,/className="smn-teams-settings-filters mb-3"/);
 assert.match(styles,/grid-template-columns:minmax\(0,2fr\) minmax\(180px,1fr\)/);
 assert.match(styles,/@media\(max-width:720px\)/);
 assert.match(styles,/--smn-context-start/);
 assert.match(styles,/--smn-context-end/);
 assert.match(page,/import "\.\/teams-settings\.css"/);
});
