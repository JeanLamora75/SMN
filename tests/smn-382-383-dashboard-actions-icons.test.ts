import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {DASHBOARD_ICONS,isDashboardIcon} from "../src/lib/dashboard-builder/icon-catalog";
import {duplicateDashboardBlock,changeDashboardBlockTemplate,blockHasConfiguredContent} from "../src/lib/dashboard-builder/block-actions";

test("SMN-383 AC01: catalogue de noms Bootstrap unique et validé",()=>{
 const names=DASHBOARD_ICONS.map(item=>item.name);
 assert.equal(names.length,new Set(names).size);
 assert.ok(names.length>=20);
 assert.equal(isDashboardIcon("ticket-perforated-fill"),true);
 assert.equal(isDashboardIcon("inconnu"),false);
 assert.equal(isDashboardIcon("<svg onload=alert(1)>"),false);
});
test("SMN-383 AC04: icônes facultatives, JSONB compatible et validation serveur",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 assert.doesNotThrow(()=>validateDashboardLayout(layout));
 layout.header.blocks[0].icon="calendar3";
 const first=layout.rows[0].blocks[0];
 first.icon="ticket-perforated-fill";
 first.slots[0].icon="bar-chart-line";
 assert.doesNotThrow(()=>validateDashboardLayout(layout));
 assert.deepEqual(JSON.parse(JSON.stringify(layout)).rows[0].blocks[0].slots[0].icon,"bar-chart-line");
 first.icon="javascript:evil";
 assert.throws(()=>validateDashboardLayout(layout),/block-icon-invalid/);
 first.icon=undefined;
 first.slots[0].icon="javascript:evil";
 assert.throws(()=>validateDashboardLayout(layout),/slot-icon-invalid/);
});
test("SMN-383 AC05: duplication et changement de modèle conservent les icônes",()=>{
 const layout=createDefaultDashboardLayout("kanban");
 const block=layout.rows[0].blocks[0];
 block.icon="people-fill";block.slots[0].icon="tag";
 assert.equal(blockHasConfiguredContent(block),true);
 const duplicate=duplicateDashboardBlock(layout,block.id,"icon-copy",["icon-slot"]);
 assert.equal(duplicate.rows[0].blocks[1].icon,"people-fill");
 assert.equal(duplicate.rows[0].blocks[1].slots[0].icon,"tag");
 const transformed=changeDashboardBlockTemplate(layout,block.id,"M02",["slot-second"]).layout;
 assert.equal(transformed.rows[0].blocks[0].icon,"people-fill");
 assert.equal(transformed.rows[0].blocks[0].slots[0].icon,"tag");
 validateDashboardLayout(transformed);
});
test("SMN-382 AC01-04: menu, contraste et rafraîchissement raccordés",()=>{
 const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-dimensions.module.css",import.meta.url),"utf8");
 const menu=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-actions-menu.tsx",import.meta.url),"utf8");
 assert.match(editor,/DashboardActionsMenu/);
 assert.match(consultation,/headerButton/);
 assert.match(css,/overflow:visible/);
 assert.match(css,/\.headerButton/);
 assert.match(menu,/Escape/);
 assert.match(menu,/pointerdown/);
 assert.match(menu,/aria-expanded/);
});
test("SMN-383 AC03: picker et icônes dans le rendu réel",()=>{
 const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 const picker=readFileSync(new URL("../src/app/app/icon-picker.tsx",import.meta.url),"utf8");
 assert.match(editor,/setBlockIcon/);
 assert.match(editor,/setSlotIcon/);
 assert.match(editor,/IconPicker/);
 assert.match(consultation,/BootstrapIcon name=\{block\.icon\}/);
 assert.match(consultation,/BootstrapIcon name=\{slot\.icon\}/);
 assert.match(picker,/aria-modal="true"/);
 assert.match(picker,/Sans icône/);
});
