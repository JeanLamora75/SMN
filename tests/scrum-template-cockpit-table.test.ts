import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("src/app/app/admin/settings/ceremonies/page.tsx");
const form=read("src/app/app/admin/sprints/template-form.tsx");
const api=read("src/app/api/admin/sprints/templates/route.ts");
const server=read("src/server/sprints/ceremony-templates.ts");
const css=read("src/app/app/admin/settings/ceremonies/ceremony-templates-cockpit.css");

test("New Template appears in the settings hero and opens the modal",()=>{
 assert.match(page,/action=\{<TemplateCreateButton\/>\}/);
 assert.match(form,/window\.addEventListener\(OPEN_CEREMONY_TEMPLATE,listener\)/);
 assert.match(form,/dialog\.showModal\(\)/);
 assert.match(form,/onCancel=\{event=>\{event\.preventDefault\(\);closeEditor\(\);\}\}/);
 assert.match(form,/smn-ceremony-template-header/);
 assert.match(form,/smn-ceremony-template-body/);
 assert.match(form,/smn-ceremony-template-footer/);
 assert.doesNotMatch(form,/id="template-existing"/);
});
test("template rows show icon, name, frequency, time, duration and edit/delete",()=>{
 for(const key of ["icon","name","frequency","time","duration","actions"]){
  assert.match(form,new RegExp('t\\("ceremonyTemplates\\.'+key+'"\\)'));
 }
 assert.match(form,/row\.icon\?<SMNIcon/);
 assert.match(form,/row\.time\.slice\(0,5\)/);
 assert.match(form,/row\.duration\} min/);
 assert.match(form,/bi-pencil-square/);
 assert.match(form,/bi-trash3/);
 assert.match(form,/onClick=\{\(\)=>choose\(row\.id\)\}/);
 assert.match(form,/onClick=\{\(\)=>void remove\(row\)\}/);
});
test("permanent deletion is authorized, revision-checked and preserves generated Sprint events",()=>{
 assert.match(api,/export async function DELETE/);
 assert.match(api,/authorizeApi\(req,"write",target\)/);
 assert.match(server,/SELECT revision FROM public\.smn_scrum_ceremony_template/);
 assert.match(server,/FOR UPDATE/);
 assert.match(server,/smn_scrum_template_occurrence WHERE template_id=\$1/);
 assert.match(server,/error:"has-occurrences"/);
 assert.match(server,/DELETE FROM public\.smn_scrum_ceremony_template_history/);
 assert.match(server,/DELETE FROM public\.smn_scrum_ceremony_template WHERE id=\$1/);
 assert.doesNotMatch(server,/DELETE FROM public\.smn_scrum_template_occurrence/);
});
test("all new labels exist in French and English and colors follow the theme",()=>{
 for(const key of ["icon","status","actions","edit","delete","cancel","confirmDelete","deleted","deleteError","hasOccurrences","conflict"] as const){
  assert.ok(fr.ceremonyTemplates[key],key);assert.ok(en.ceremonyTemplates[key],key);
 }
 assert.match(css,/--smn-context-start/);
 assert.match(css,/--smn-context-end/);
 assert.match(css,/@media\(max-width:767\.98px\)/);
});
