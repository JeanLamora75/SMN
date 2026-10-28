import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const cockpit=readFileSync(new URL("../src/app/app/admin/links/links-cockpit.tsx",import.meta.url),"utf8");
test("delete sends optimistic revision and prevents a second request while pending",()=>{
 assert.match(cockpit,/if\(!deleting\|\|busy\)return/);
 assert.match(cockpit,/JSON\.stringify\(\{revision:deleting\.revision\}\)/);
 assert.match(cockpit,/locked=\{busy\}/);
});
test("delete retains confirmation on network error and distinguishes statuses",()=>{
 assert.match(cockpit,/status==="409"\?t\("links\.conflict"\)/);
 assert.match(cockpit,/status==="404"\?t\("links\.notFound"\)/);
 assert.match(cockpit,/status==="403"\?t\("links\.forbidden"\)/);
 assert.match(cockpit,/setMutationError\(/);
});
