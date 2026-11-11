import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {composeAdaptiveChart,renderAdaptiveChartPng} from "../scripts/smn-412-adaptive-chart.mjs";

const source=readFileSync(new URL("../src/app/app/admin/indicators/indicator-trends.tsx",import.meta.url),"utf8");
const renderer=readFileSync(new URL("../scripts/smn-412-adaptive-chart.mjs",import.meta.url),"utf8");
const target={widthEmu:960*3048,heightEmu:560*3048};
const cycles=Array.from({length:12},(_,i)=>({name:"Sprint complet numéro "+(i+1)}));
const series=[{name:"Points terminés",unit:"SP",values:cycles.map((_,i)=>i+1)}];

test("Tendances: le rendu partagé conserve les labels et les incline quand l'espace est insuffisant",()=>{
 assert.match(source,/<SharedTrendChart payload=/);
 assert.match(renderer,/const useRotation=heavy&&cycles\.length>6/);
 const scene=composeAdaptiveChart({target,cycles,series,type:"line",locale:"fr"});
 assert.ok(scene);
 assert.equal("rotated" in scene.meta&&scene.meta.rotated,true);
 assert.match(scene.svg,/rotate\(-45/);
 assert.ok(scene.meta.labels.length===cycles.length);
 assert.ok(scene.meta.labels.every((v:string)=>v.startsWith("Sprint")));
});

test("Tendances: le PNG partagé respecte la géométrie et conserve les libellés en fin de graphique",()=>{
 const png=renderAdaptiveChartPng({target,cycles,series,type:"bar",locale:"fr"});
 assert.ok(Buffer.isBuffer(png));
 assert.equal(png.readUInt32BE(16),960);
 assert.equal(png.readUInt32BE(20),560);
 assert.match(source,/downloadName=/);
});

test("Tendances: seules les visualisations avec axes ont des libellés inclinés",()=>{
 const axes=composeAdaptiveChart({target,cycles,series,type:"area",locale:"fr"});
 assert.equal(!!axes&&"rotated" in axes.meta&&axes.meta.rotated,true);
 const pie=composeAdaptiveChart({target,cycles,series,type:"pie",locale:"fr"});
 assert.ok(pie);
 assert.notEqual("rotated" in pie.meta&&pie.meta.rotated,true);
});
