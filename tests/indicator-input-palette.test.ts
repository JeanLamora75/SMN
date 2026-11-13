import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const css=readFileSync(new URL("../src/app/app/admin/indicators/universal-input.module.css",import.meta.url),"utf8");
const jsx=readFileSync(new URL("../src/app/app/admin/indicators/universal-input.tsx",import.meta.url),"utf8");

test("indicator entry dialog uses live theme palette instead of hard-coded blue header",()=>{
 const header=css.match(/\.header\{[^}]+\}/)?.[0]??"";
 const computed=css.match(/\.computedToggle\{[^}]+\}/)?.[0]??"";
 assert.match(header,/var\(--smn-brand/);
 assert.match(computed,/var\(--smn-brand/);
 assert.doesNotMatch(header,/#102c4f|#194b80|#10345b/);
 assert.doesNotMatch(computed,/#13335a|#20578f/);
 assert.match(css,/\.eyebrow\{[^}]*rgba\(255,255,255,\.86\)/);
 assert.match(jsx,/className=\{styles\.header\}/);
 assert.match(jsx,/className=\{styles\.computedToggle\}/);
});
test("dialog keeps theme-aware surfaces, accessible controls and mobile layout",()=>{
 assert.match(css,/\.dialog\{[^}]*var\(--smn-surface/);
 assert.match(css,/\.footer\{[^}]*var\(--smn-muted-soft/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(jsx,/onCancel=\{e=>\{e\.preventDefault\(\);close\(\);\}\}/);
 assert.match(jsx,/onClick=\{\(\)=>void run\("save"\)\}/);
});
