import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=path=>readFileSync(path,"utf8");
const page=source("src/app/app/admin/ai-briefs/prepare/page.tsx");
const editor=source("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx");
const styles=source("src/app/app/admin/ai-briefs/prepare/brief-cockpit.css");

test("Cockpit Agile AI brief has a clear page hero and compact cycle context",()=>{
 assert.match(page,/smn-brief-cockpit/);
 assert.match(page,/smn-brief-hero/);
 assert.match(page,/smn-brief-context-item/);
 assert.match(page,/smn-brief-template-list/);
 assert.match(page,/brief-cockpit\.css/);
 assert.doesNotMatch(page,/<dt className="col-sm-3">/);
});

test("Indicators and optional human analysis are collapsed by default, but remain reachable",()=>{
 assert.match(page,/<details className="smn-brief-details">/);
 assert.match(page,/<table className="table smn-brief-data-table">/);
 assert.match(page,/formatBriefNumericValue\(item.value,locale\)/);
 assert.match(page,/HumanAnalysisForm/);
 assert.doesNotMatch(page,/<details className="smn-brief-details" open/);
 assert.match(page,/role="alert" className="alert alert-warning mb-3"/);
});

test("Editor keeps its preview, tag insertion, privacy review and gated archive controls",()=>{
 assert.match(editor,/smn-brief-edit-grid/);
 assert.match(editor,/smn-brief-editor-pane/);
 assert.match(editor,/smn-brief-actions/);
 assert.match(editor,/OfficeTagConfigurator/);
 assert.match(editor,/onClick=\{\(\)=>void generatePreview\(\)\}/);
 assert.match(editor,/checked=\{privacyReviewed\}/);
 assert.doesNotMatch(editor,/checked=\{approved\}/);
 assert.match(editor,/canApproveBrief/);
 assert.match(editor,/onClick=\{\(\)=>void finalize\(\)\}/);
 assert.match(editor,/BriefAiSendPanel/);
});

test("Cockpit layout uses theme tokens and mobile-first single column behavior",()=>{
 assert.match(styles,/var\(--smn-surface\)/);
 assert.match(styles,/var\(--smn-border\)/);
 assert.match(styles,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(styles,/@media\(max-width:1000px\)/);
 assert.match(styles,/@media\(max-width:640px\)/);
 assert.match(styles,/smn-brief-actions/);
});
