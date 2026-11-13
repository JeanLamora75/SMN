import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const css=readFileSync(new URL("../src/app/app/admin/members/team-cockpit.css",import.meta.url),"utf8");
const shell=readFileSync(new URL("../src/app/app/admin/settings/settings-page-shell.css",import.meta.url),"utf8");
test("team header shares active Cockpit Agile theme gradient",()=>{
 const hero=css.match(/\.smn-team-cockpit \.smn-team-hero\{[^}]+\}/)?.[0]??"";
 assert.match(hero,/var\(--smn-brand/);
 assert.match(hero,/var\(--smn-brand-dark/);
 assert.match(shell,/linear-gradient\(115deg,var\(--smn-brand/);
 assert.doesNotMatch(hero,/#10294d|#25466e/);
 assert.doesNotMatch(css,/\[data-bs-theme="dark"\] \.smn-team-cockpit \.smn-team-hero/);
});
test("team view buttons use theme colors rather than hard-coded blue",()=>{
 assert.match(css,/smn-team-view-button\[aria-pressed="true"\]/);
 assert.match(css,/color:var\(--smn-brand-dark/);
 assert.match(css,/smn-team-create/);
 assert.match(css,/@media \(max-width:650px\)/);
});
