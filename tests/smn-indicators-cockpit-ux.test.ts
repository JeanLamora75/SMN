import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("indicator entry sits between Calendar and Register and uses singular label",()=>{
 const nav=read("src/lib/private-navigation.ts");
 const a=nav.indexOf('id:"centralCalendar"'),b=nav.indexOf('id:"indicators"'),c=nav.indexOf('id:"risks"');
 assert.ok(a>=0&&a<b&&b<c);
 assert.match(nav,/indicators\.navTitle/);
});
test("global catalog is administrator-only and linked from Settings",()=>{
 const settings=read("src/app/app/admin/settings/indicators/page.tsx");
 const portal=read("src/app/app/admin/settings/settings-catalog-view.tsx");
 assert.match(settings,/account\.role!=="admin"/);
 assert.match(settings,/scope="global"/);
 assert.match(portal,/app\/admin\/settings\/indicators/);
});
test("team cockpit exposes all cycles with edit modal and collapsible preferences",()=>{
 const landing=read("src/app/app/admin/indicators/page.tsx");
 const tabs=read("src/app/app/admin/indicators/catalog-client.tsx");
 const cycles=read("src/app/app/admin/indicators/indicator-cycles.tsx");
 assert.match(landing,/activeTeamId=\{team\}/);
 assert.match(tabs,/scope==="team"\?\[\{id:"cycles"/);
 assert.match(tabs,/<details key=\{screen\}/);
 assert.match(cycles,/UniversalIndicatorInput/);
 assert.match(cycles,/buttonLabel=\{t\("indicators\.edit"\)\}/);
 assert.doesNotMatch(landing,/TeamGrants/);
 assert.match(settingsGuard(),/TeamGrants/);
});
function settingsGuard(){return read("src/app/app/admin/settings/indicators/page.tsx");}
