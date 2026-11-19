import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {loadHelpContent} from "../src/server/help-content";
import {helpArticleForContext} from "../src/lib/help-catalog";

const source=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const user={role:"user",is_active:true,must_change_password:false};
const admin={role:"admin",is_active:true,must_change_password:false};

describe("SMN-463 — reusable Cockpit contextual help",()=>{
 it("uses a shared modal component and the existing brand styling",()=>{
  const component=source("src/app/app/help/help-context-button.tsx");
  const css=source("src/app/app/help/help-dialog.css");
  assert.match(component,/export function HelpContextButton/);
  assert.match(component,/smn-cockpit-modal smn-help-dialog/);
  assert.match(component,/smn-cockpit-modal-header/);
  assert.match(component,/smn-cockpit-modal-body/);
  assert.match(component,/smn-cockpit-modal-footer/);
  assert.match(css,/::backdrop/);
  assert.match(css,/max-height:calc\(100dvh/);
  assert.match(css,/var\(--smn-brand/);
  assert.match(css,/@media\(max-width:575\.98px\)/);
 });
 it("protects the background form state and avoids overlapping dialogs",()=>{
  const component=source("src/app/app/help/help-context-button.tsx");
  assert.match(component,/type="button"/);
  assert.match(component,/competingModal\(\)/);
  assert.match(component,/document\.querySelector\(/);
  assert.match(component,/window\.open\(guideHref,"_blank","noopener,noreferrer"\)/);
  assert.match(component,/setOpen\(false\)/);
  assert.doesNotMatch(component,/form\.reset\(|localStorage|sessionStorage|method:"POST"/);
 });
 it("traps focus, handles Escape and restores the invoking button",()=>{
  const component=source("src/app/app/help/help-context-button.tsx");
  for(const expression of [/node\.showModal\(\)/,/node\.close\(\)/,/event\.key==="Escape"/,
   /event\.key!=="Tab"/,/event\.shiftKey/,/openerNode\?\.focus\(\)/,
   /aria-modal="true"/,/aria-labelledby=\{titleId\}/,/data-initial-focus="true"/,
   /onCancel=\{event=>\{event\.preventDefault\(\);close\(\);\}\}/]){
   assert.match(component,expression);
  }
 });
 it("loads only on demand through a GET endpoint, handles errors and abort",()=>{
  const component=source("src/app/app/help/help-context-button.tsx");
  const endpoint=source("src/app/api/help/articles/[articleId]/route.ts");
  assert.match(component,/if\(!open\)return;/);
  assert.match(component,/method:"GET",cache:"no-store",signal:controller\.signal/);
  assert.match(component,/controller\.abort\(\)/);
  assert.match(component,/state\.status==="loading"/);
  assert.match(component,/state\.status==="unavailable"/);
  assert.match(component,/SafeHelpMarkdown markdown=\{state\.article\.markdown\}/);
  assert.match(endpoint,/export async function GET/);
  assert.match(endpoint,/currentAccount\(\)/);
  assert.match(endpoint,/canAccess\(actor,"read"/);
  assert.match(endpoint,/loadHelpContent\(articleId,locale,actor,mode\)/);
  assert.match(endpoint,/status:404/);
  assert.match(endpoint,/Cache-Control":"private, no-store"/);
  assert.doesNotMatch(endpoint,/export async function (?:POST|PATCH|PUT|DELETE)/);
 });
 it("reuses the permission and locale checks of existing documents",async()=>{
  assert.equal(helpArticleForContext("/app/tickets",user,"scrum")?.id,"tickets");
  assert.equal(helpArticleForContext("/app/admin/settings",user,"scrum"),null);
  assert.equal(helpArticleForContext("/app/admin/settings",admin,"scrum")?.id,"general-settings");
  assert.equal((await loadHelpContent("tickets","en",user,"scrum")).status,"ready");
  assert.equal((await loadHelpContent("general-settings","en",user,"scrum")).status,"forbidden");
  assert.equal((await loadHelpContent("general-settings","en",admin,"scrum")).status,"ready");
 });
 it("provides compact FR/EN dialog messages without long help text in i18n",()=>{
  for(const lang of ["fr","en"]){
   const text=JSON.parse(source("src/i18n/"+lang+".json")).helpCenter;
   for(const name of ["close","loading","fullGuide","fallback","articleUnavailable"]){
    assert.equal(typeof text[name],"string");
    assert.ok(text[name].length>0);
   }
  }
 });
});
