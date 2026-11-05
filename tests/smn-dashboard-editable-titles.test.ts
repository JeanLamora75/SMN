import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");

test("Le titre suggéré est une valeur de brouillon éditable, pas un placeholder",()=>{
 assert.match(source,/const suggestedTitle=sourceByCode\.get\(source\)\?\.name\?\?""/);
 assert.match(source,/previous\?\.title\?\.trim\(\)\|\|!suggestedTitle/);
 assert.match(source,/title:suggestedTitle/);
 assert.match(source,/Saisir un titre personnalisé \(facultatif\)/);
 assert.doesNotMatch(source,/placeholder=\{sourceByCode\.get\(slot\.source/);
});
test("Les titres de slots préexistants sont activés à la prise de focus, en tête et en corps",()=>{
 assert.equal((source.match(/onFocus=\{\(\)=>\{if\(!slot\.title\?\.trim\(\)&&slot\.source\)/g)??[]).length,2);
 assert.equal((source.match(/if\(sourceName\)setSlotTitle\(slot\.id,sourceName\)/g)??[]).length,2);
 assert.match(source,/onChange=\{e=>setSlotTitle\(slot\.id,e\.target\.value\)\}/);
 assert.match(source,/onChange=\{e=>setBlockTitle\(block\.id,e\.target\.value\)\}/);
});
test("Le dashboard ne publie pas sans Enregistrer",()=>{
 assert.match(source,/setDraft\(current=>\{/);
 assert.match(source,/onClick=\{\(\)=>void save\(\)\}/);
 assert.match(source,/disabled=\{!changed\|\|saving\}/);
});
