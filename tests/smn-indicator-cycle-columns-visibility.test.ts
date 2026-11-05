import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const cycles=read("src/app/app/admin/indicators/indicator-cycles.tsx");
const catalog=read("src/app/app/admin/indicators/catalog-client.tsx");
const css=read("src/app/app/admin/indicators/indicator-cockpit.css");
const reporting=read("src/server/indicators/reporting.ts");

test("Le tableau des cycles fournit un accès aux préférences de colonnes",()=>{
 assert.match(cycles,/Gérer les colonnes/);
 assert.match(cycles,/href="#preferences"/);
 assert.match(cycles,/smn-indicator-cycle-scroll/);
 assert.match(cycles,/aria-label="Tableau des indicateurs par cycle, défilement horizontal"/);
 assert.match(cycles,/smn-cycle-name-col/);
 assert.match(cycles,/smn-cycle-status-col/);
 assert.match(cycles,/smn-cycle-period-col/);
});
test("Les réglages Liste des cycles sont accessibles et utilisent la préférence existante",()=>{
 assert.match(catalog,/id:"preferences"/);
 assert.match(catalog,/screen==="cycle_list"/);
 assert.match(catalog,/action:"preference"/);
 assert.match(catalog,/visible:p\?\.is_visible\?\?true/);
 assert.match(catalog,/screenKey:screen/);
 assert.match(reporting,/p\.screen_key=\$2/);
 assert.match(reporting,/COALESCE\(p\.is_visible,true\)=true/);
 assert.match(cycles,/screen:"cycle_list"/);
});
test("Les métadonnées Cycle Statut Période restent lisibles et les mesures défilent",()=>{
 assert.match(css,/width:max-content;min-width:100%;table-layout:auto/);
 assert.match(css,/\.smn-cycle-name-col\{\s*min-width:190px/);
 assert.match(css,/\.smn-cycle-status-col\{\s*min-width:105px/);
 assert.match(css,/\.smn-cycle-period-col\{\s*min-width:210px/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/word-break:normal/);
});
