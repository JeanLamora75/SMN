import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("le catalogue des indicateurs réutilise IconPicker pour créer et modifier une icône",()=>{
 const source=read("src/app/app/admin/indicators/catalog-client.tsx");
 assert.match(source,/import \{IconPicker\} from "\.\.\/\.\.\/icon-picker"/);
 assert.match(source,/<IconPicker value=\{icon\} onChange=\{name=>setIcon\(name\?\?""\)\}/);
 assert.match(source,/setIcon\(d\?\.icon\?\?""\)/);
 assert.match(source,/icon:icon\|\|null/);
 assert.doesNotMatch(source,/<input className="form-control" value=\{icon\}/);
});
test("le catalogue partagé conserve la recherche, les favoris et la suppression de l'icône",()=>{
 const picker=read("src/app/app/icon-picker.tsx");
 assert.match(picker,/DASHBOARD_ICONS\.filter/);
 assert.match(picker,/localStorage\.setItem/);
 assert.match(picker,/onChange\(undefined\)/);
});
test("une bibliothèque d'icônes ouverte au-dessus du Cockpit garde le clavier et le focus",()=>{
 const picker=read("src/app/app/icon-picker.tsx");
 const focus=read("src/app/app/dashboard-builder/modal-focus.ts");
 assert.match(picker,/createPortal\(<div className="modal d-block"/);
 assert.match(picker,/zIndex:1090/);
 assert.match(picker,/data-smn-icon-picker-dialog="true"/);
 assert.match(picker,/document\.body\)/);
 assert.match(focus,/closest\("\[data-smn-icon-picker-dialog\]"\)/);
});
