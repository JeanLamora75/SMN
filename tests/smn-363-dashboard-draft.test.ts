import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
const page=readFileSync(new URL("../src/app/app/dashboard-builder/page.tsx",import.meta.url),"utf8");
test("SMN-363 AC1: draft is distinct and personalization requires edit permission",()=>{
 assert.match(editor,/setDraft\(copy\(published\)\)/);
 assert.match(editor,/if\(!canEdit\)return/);
 assert.match(editor,/<summary className="btn btn-outline-primary btn-sm">Actions<\/summary>/);
 assert.match(editor,/Personnaliser/);
 assert.match(page,/dashboardPermission\(db/);
 assert.match(page,/canEdit=\{data.canEdit\}/);
});
test("SMN-363 AC2: explicit optimistic save, unchanged state disables action",()=>{
 assert.match(editor,/expectedRevision:revision/);
 assert.match(editor,/method:"PUT"/);
 assert.match(editor,/disabled=\{!changed\|\|saving\}/);
 assert.match(editor,/position-fixed bottom-0/);
 assert.match(editor,/Aucune modification/);
});
test("SMN-363 AC3: all three exit outcomes available",()=>{
 assert.match(editor,/Enregistrer et quitter/);
 assert.match(editor,/Quitter sans enregistrer/);
 assert.match(editor,/Continuer la personnalisation/);
 assert.match(editor,/setDraft\(null\)/);
});
test("SMN-363 AC4: conflict/network errors keep draft and navigation disabled",()=>{
 assert.match(editor,/response.status===409/);
 assert.match(editor,/Votre brouillon est conservé/);
 assert.match(editor,/personalizing=\{editing\}/);
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 assert.match(consultation,/navigation.previous&&!personalizing/);
 assert.match(consultation,/navigation.next&&!personalizing/);
});

test("Dashboard Builder: slot displays business source labels without leaking UUIDs",()=>{
 assert.match(editor,/fetch\("\/api\/dashboard-builder\/sources\?"/);
 assert.match(editor,/sourceByCode\.get\(slot\.source\)\?\.name/);
 assert.match(editor,/Source introuvable/);
 assert.doesNotMatch(editor,/["\u0027]✎ ["\u0027]\+slot\.source/);
 assert.match(editor,/updateDashboardSlot\(current,wizardSlot,\{source,view,filters:options\}\)/);
});

test("Dashboard Builder: editing is separate from consultation and has responsive cards",()=>{
 assert.match(editor,/!editing&&<DashboardConsultation/);
 assert.match(editor,/editing&&draft&&<details className="smn-panel p-3 mb-3"/);
 assert.match(editor,/row-cols-1 row-cols-xl-2 g-3/);
 assert.match(editor,/row-cols-1 row-cols-md-2 g-2/);
 assert.match(editor,/Personnaliser les blocs d’en-tête/);
});

test("Dashboard Builder: list quick-add appears after results and supports notes, ceremonies, risks and obstacles",()=>{
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 const resultPosition=consultation.indexOf("<DashboardBusinessList");
 const footerPosition=consultation.indexOf('className="border-top mt-3 pt-2 text-center"');
 assert.ok(resultPosition>=0&&footerPosition>resultPosition);
 for(const source of ["calendar:ceremonies","notes:sprint","registry:items"])assert.ok(consultation.includes(source));
 for(const kind of ['kind="risks"','kind="obstacles"','+ Ajouter une note','+ Ajouter un événement'])assert.ok(consultation.includes(kind));
 assert.match(consultation,/canManage&&mode==="scrum"&&cycleId&&!personalizing&&navigation\.current\?\.status!=="closed"/);
 assert.match(consultation,/onSaved=\{refresh\}/);
});

test("Dashboard Builder: en-tête Cockpit Agile unique et commandes intégrées",()=>{
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/app/app/dashboard-builder/page.tsx",import.meta.url),"utf8");
 assert.doesNotMatch(page,/← Tableau de bord principal/);
 assert.doesNotMatch(page,/<h2 className="h5 mb-0">\{data.teamName\}/);
 assert.match(consultation,/aria-label="En-tête du tableau de bord"/);
 assert.match(consultation,/className=\{styles\.cockpitTitle\}/);
 assert.match(consultation,/\{headerActions\}/);
 assert.match(consultation,/Actualiser/);
 assert.doesNotMatch(consultation,/<h1 className="h4 mb-0">Tableau de bord<\/h1>/);
});

test("Dashboard Builder: référence Cockpit Agile respecte shell et jauge sans bornes fictives",()=>{
 const shell=readFileSync(new URL("../src/app/app/private-shell.tsx",import.meta.url),"utf8");
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 const visual=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-visualization.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-dimensions.module.css",import.meta.url),"utf8");
 assert.match(shell,/<PrivateNavigation /);
 assert.match(shell,/<ActiveTeamSelector /);
 assert.match(consultation,/styles\.cockpitHeader/);
 assert.match(consultation,/styles\.headerKpis/);
 assert.match(consultation,/layout\.header\.blocks\.map/);
 assert.doesNotMatch(consultation,/<ActiveTeamSelector/);
 assert.match(consultation,/slot\.view==="gauge"\?\{state:"invalid-bounds"/);
 assert.match(visual,/model\.ratio===undefined/);
 assert.match(css,/\.cockpitLayout/);
 assert.match(css,/@media\(max-width:767\.98px\)/);
});
