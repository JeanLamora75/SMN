import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const css=readFileSync(new URL("../src/app/dashboard.css",import.meta.url),"utf8");
const section=css.slice(css.indexOf("/* Sidebar refresh 2026-10-24"),css.indexOf("/* SMN-235"));

test("sidebar background follows active palette in light and dark",()=>{
 assert.match(section,/\.smn-private-layout \.smn-sidebar-region\s*\{\s*background:linear-gradient\(180deg,var\(--smn-soft\) 0%,var\(--smn-surface\) 100%\)/);
 assert.doesNotMatch(section,/#f7fbff/i);
});
test("active sidebar navigation uses semantic palette colors",()=>{
 assert.match(section,/\.smn-private-layout \.smn-private-nav-list \.smn-nav-link\.is-active\s*\{\s*background:var\(--smn-highlight\);color:var\(--smn-primary\)/);
 assert.match(section,/\.smn-private-layout \.smn-private-nav-list \.smn-nav-link\.is-active::before\s*\{[^}]*background:var\(--smn-primary\)/);
 assert.doesNotMatch(section,/#e2efff|#174f91|#1869cb/i);
});
