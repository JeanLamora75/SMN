import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const catalog=read("src/app/app/admin/indicators/catalog-client.tsx");
const css=read("src/app/app/admin/indicators/indicator-definition-modal.module.css");

test("Création et modification partagent une modale Cockpit Agile, pas un formulaire en bas de page",()=>{
 assert.match(catalog,/createPortal\(<div className=\{ui\.overlay\}/);
 assert.match(catalog,/role="dialog" aria-modal="true"/);
 assert.match(catalog,/Cockpit Agile · Administration des indicateurs/);
 assert.match(catalog,/onClick=\{\(\)=>editor\(\)\}/);
 assert.equal((catalog.match(/onClick=\{\(\)=>editor\(d\)\}/g)??[]).length,2);
 assert.doesNotMatch(catalog,/<section className="smn-panel rounded-4 p-4 mt-4" aria-label=\{t\("indicators\.editor"\)\}/);
});
test("Contrats du formulaire préservés : validation, création/édition, preview calculée et archivage",()=>{
 assert.match(catalog,/action:"create"/);
 assert.match(catalog,/action:"edit"/);
 assert.match(catalog,/indicatorId:edit\?\.id/);
 assert.match(catalog,/pattern="\[A-Z\]\[A-Z0-9_\]\*"/);
 assert.match(catalog,/required value=\{formula\}/);
 assert.match(catalog,/FormulaPublicationEditor/);
 assert.match(catalog,/form="indicator-definition-form"/);
 assert.match(catalog,/if\(ok\)\{setCreate\(false\);setEdit\(null\);\}/);
 assert.equal((catalog.match(/action:"archive"/g)??[]).length,2);
});
test("Fermeture, accessibilité et état d'échec de sauvegarde",()=>{
 assert.match(catalog,/useDashboardModalFocus\(closeEditor/);
 assert.match(catalog,/aria-labelledby="indicator-definition-modal-title"/);
 assert.match(catalog,/aria-describedby="indicator-definition-modal-subtitle"/);
 assert.match(catalog,/role="alert" className="alert alert-danger"/);
 assert.match(catalog,/if\(busy\)return;setCreate\(false\);setEdit\(null\);/);
 assert.match(catalog,/disabled=\{busy\}/);
});
test("L'apparence Cockpit Agile reste adaptée aux thèmes, au mobile et au clavier",()=>{
 assert.match(css,/--smn-brand/);
 assert.match(css,/--smn-border/);
 assert.match(css,/--bs-body-bg/);
 assert.match(css,/max-height:calc\(100dvh/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/\.footer/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(max-width:640px\)/);
});
