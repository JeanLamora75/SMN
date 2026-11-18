import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("les préférences du détail de cycle ordonnent poignée, icône/code, nom, visibilité et présentation",()=>{
 const component=read("src/app/app/admin/indicators/preference-order-table.tsx");
 const handle=component.indexOf('className="smn-indicator-preference-handle-cell">');
 const code=component.indexOf('className="smn-indicator-preference-code-cell">',handle);
 const name=component.indexOf('className="smn-indicator-preference-name-cell">',code);
 const visible=component.indexOf('className="smn-indicator-preference-visible-cell">',name);
 const style=component.indexOf('className="smn-indicator-preference-style-cell">',visible);
 assert.ok(handle>=0&&code>handle&&name>code&&visible>name&&style>visible);
 assert.match(component,/<SMNIcon name=\{d\.icon\}\/>/);
 assert.match(component,/d\.icon&&isDashboardIcon\(d\.icon\)/);
 assert.match(component,/d\.color&&\/\^#\[0-9a-fA-F\]\{6\}\$\/\.test\(d\.color\)/);
 assert.match(component,/role="switch"/);
 assert.match(component,/checked=\{p\?\.is_visible\?\?true\}/);
 assert.match(component,/onChange=\{e=>savePreference\(\{visible:e\.target\.checked\}\)\}/);
});

test("le tri par glisser-déposer reste opérationnel sans boutons monter/descendre",()=>{
 const component=read("src/app/app/admin/indicators/preference-order-table.tsx");
 assert.match(component,/draggable=\{!busy\}/);
 assert.match(component,/onDragStart=\{e=>begin\(e,d\.id\)\}/);
 assert.match(component,/onDrop=\{e=>drop\(e,d\.id\)\}/);
 assert.match(component,/action:"reorder"/);
 assert.doesNotMatch(component,/Monter \+d\.name|Descendre \+d\.name/);
});

test("la présentation reste dans une cellule alignée à droite et de taille compacte",()=>{
 const component=read("src/app/app/admin/indicators/preference-order-table.tsx");
 const css=read("src/app/app/admin/settings/indicators/indicator-settings-cockpit.css");
 assert.match(component,/className="form-select form-select-sm"/);
 assert.match(css,/smn-indicator-preference-style-cell \.form-select\{[\s\S]*?width:max-content/);
 assert.match(css,/min-width:125px;max-width:100%;margin-left:auto/);
 assert.match(css,/smn-indicator-preference-icon/);
});
