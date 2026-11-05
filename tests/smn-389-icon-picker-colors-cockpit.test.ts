import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const file=(path:string)=>readFileSync(path,"utf8");
const picker=file("src/app/app/icon-picker.tsx");
const ceremony=file("src/app/app/admin/sprints/template-form.tsx");
const dashboard=file("src/app/app/dashboard-builder/dashboard-editor.tsx");

test("Le sélecteur commun contient les trois filtres sur une même rangée",()=>{
 assert.match(picker,/row g-2 mb-3 align-items-end flex-nowrap/);
 assert.match(picker,/>Rechercher<\/label>/);
 assert.match(picker,/>Catégorie<\/label>/);
 assert.match(picker,/>Couleur<\/label>/);
 assert.match(picker,/overflowX:"auto"/);
});
test("La couleur sélectionnée teinte toutes les icônes visibles et l'aperçu",()=>{
 assert.match(picker,/visible\.map\(icon=>/);
 assert.match(picker,/color:ceremonyIconColorHex\(draftColor\)\?\?undefined/);
 assert.match(picker,/color:ceremonyIconColorHex\(draftColor\)\?\?"var\(--bs-primary\)"/);
 assert.match(picker,/setDraftColor\(color\?\?undefined\)/);
 assert.match(picker,/onChange\(name\);onColorChange\?\.\(draftColor\)/);
});
test("Annuler ne valide pas la nouvelle couleur, Appliquer valide la couleur seule",()=>{
 assert.match(picker,/onClick=\{\(\)=>setOpen\(false\)\}>Annuler/);
 assert.match(picker,/onClick=\{\(\)=>\{onColorChange\(draftColor\);setOpen\(false\);\}\}>Appliquer la couleur/);
 assert.match(picker,/onChange\(undefined\);onColorChange\?\.\(undefined\)/);
});
test("Rendu Cockpit Agile dans la modale et composants colorimétriques unifiés",()=>{
 assert.match(picker,/Cockpit Agile · Personnalisation/);
 assert.match(picker,/Bibliothèque d’icônes/);
 assert.match(picker,/DASHBOARD_ICONS\.length/);
 assert.match(ceremony,/color=\{form\.iconColor\} onColorChange/);
 assert.doesNotMatch(ceremony,/<CeremonyColorPicker/);
 assert.doesNotMatch(dashboard,/<CeremonyColorPicker/);
 assert.equal((dashboard.match(/<IconPicker/g)??[]).length,4);
 assert.equal((dashboard.match(/onColorChange=\{color=>set(?:Block|Slot)IconColor/g)??[]).length,4);
});
