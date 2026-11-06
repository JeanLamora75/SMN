import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/app/app/admin/indicators/indicator-trends.tsx",import.meta.url),"utf8");

test("Tendances: labels complets inclinés à -45° et ancrés en fin de texte",()=>{
 assert.match(source,/rotate\(-45 \$\{x\(i\)\} 325\)/);
 assert.match(source,/textAnchor="end"[^>]*>\{range\[i\]\.name\}<\/text>/);
 assert.match(source,/viewBox="0 0 960 465"/);
 assert.match(source,/y="448" textAnchor="middle"/);
});
test("Tendances: PNG inclut les labels inclinés sans couper le pied de graphique",()=>{
 assert.match(source,/canvas\.width=1920;canvas\.height=930/);
 assert.match(source,/ctx\.drawImage\(image,0,0,canvas\.width,canvas\.height\)/);
});
test("Tendances: labels inclinés uniquement sur les graphiques à axes",()=>{
 assert.match(source,/!isParts&&applied\?\.style!=="gauge"/);
 assert.match(source,/nums\.map\(\(_,i\)=><text key=\{"label"\+i\}/);
 assert.match(source,/<title>\{range\[i\]\.name\}<\/title>/);
});
