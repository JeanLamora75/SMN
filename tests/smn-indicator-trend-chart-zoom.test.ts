import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("zoom du graphique + et - à côté de l'export PNG, accessible et borné",()=>{
 const source=read("src/app/app/admin/indicators/shared-trend-chart.tsx");
 assert.match(source,/onClick=\{save\}>\{tr\("download"\)\}/);
 assert.match(source,/onClick=\{\(\)=>changeZoom\(1\)\}>\+/);
 assert.match(source,/onClick=\{\(\)=>changeZoom\(-1\)\}>−/);
 assert.match(source,/disabled=\{zoom>=MAX_ZOOM\}/);
 assert.match(source,/disabled=\{zoom<=MIN_ZOOM\}/);
 assert.match(source,/MIN_ZOOM=50,MAX_ZOOM=200,ZOOM_STEP=10,DEFAULT_ZOOM=100/);
 assert.match(source,/aria-label=\{payload\.locale==="fr"\?"Agrandir le graphique"/);
 assert.match(source,/aria-label=\{payload\.locale==="fr"\?"Réduire le graphique"/);
});
test("persistance locale et défilement sans débordement de la page",()=>{
 const source=read("src/app/app/admin/indicators/shared-trend-chart.tsx");
 assert.match(source,/CHART_ZOOM_KEY="smn-indicator-trend-chart-zoom-v1"/);
 assert.match(source,/localStorage\.getItem\(CHART_ZOOM_KEY\)/);
 assert.match(source,/localStorage\.setItem\(CHART_ZOOM_KEY,String\(next\)\)/);
 assert.match(source,/useSyncExternalStore\(subscribeZoom,readZoom,defaultZoom\)/);
 assert.match(source,/validChartZoom\(window\.localStorage\.getItem\(CHART_ZOOM_KEY\)\)/);
 assert.match(source,/window\.dispatchEvent\(new Event\(ZOOM_CHANGE_EVENT\)\)/);
 assert.match(source,/overflowX:"auto",maxWidth:"100%",overscrollBehaviorX:"contain"/);
 assert.match(source,/width:zoom\+"%"/);
 assert.match(source,/height:"auto",maxWidth:"none"/);
});
test("le PNG continue de télécharger l'image produite par le moteur de graphiques",()=>{
 const source=read("src/app/app/admin/indicators/shared-trend-chart.tsx");
 assert.match(source,/a\.href=url;a\.download=downloadName\+"\.png"/);
 assert.match(source,/width=\{960\} height=\{560\}/);
});
