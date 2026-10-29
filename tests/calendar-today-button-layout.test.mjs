import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("calendar Today control never wraps or shrinks its label",()=>{
 const css=readFileSync(new URL("../src/app/app/team-calendar/calendar-cockpit.css",import.meta.url),"utf8");
 const rule=css.match(/\.smn-calendar-cockpit \.smn-cal-nav-today\s*\{([^}]*)\}/);
 assert.ok(rule,"Calendar Today CSS rule must exist");
 assert.match(rule[1],/white-space:\s*nowrap/);
 assert.match(rule[1],/flex:\s*0 0 auto/);
 assert.match(rule[1],/min-width:\s*max-content/);
});
