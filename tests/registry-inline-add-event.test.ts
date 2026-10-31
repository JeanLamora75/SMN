import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Création en première ligne du tableau, pas entre filtres et résultats",()=>{
 const ui=source("src/app/app/admin/registries/registry-list.tsx");
 assert.match(ui,/<tbody>\{canManage&&<tr className="smn-registry-create-table-row"/);
 assert.match(ui,/restrictedTypes=\{visibleRegistryTypes\}/);
 assert.equal((ui.match(/className="smn-registry-add-event"/g)??[]).length,1);
});
test("Filtres fermés initialement, option résolus, colonnes compteurs",()=>{
 const ui=source("src/app/app/admin/registries/registry-list.tsx");
 assert.match(ui,/\[filtersOpen,setFiltersOpen\]=useState\(false\)/);
 assert.match(ui,/params\.set\("showResolved",String\(showResolved\)\)/);
 assert.match(ui,/\["decisions","actions","highlights","comments"\]/);
});
test("La modale restreinte ne change pas les autres parcours de création",()=>{
 const modal=source("src/app/app/admin/registries/registry-create-modal.tsx");
 assert.match(modal,/restrictedTypes\?\?\(linkedFromJournal\?linkedJournalTypes:registryTypes\)/);
});

test("Compteurs visuellement renforcés et en-têtes tronqués",()=>{
 const css=source("src/app/app/admin/registries/registry-cockpit.css");
 const ui=source("src/app/app/admin/registries/registry-list.tsx");
 assert.match(ui,/smn-registry-count-heading/);
 assert.match(css,/\.smn-registry-count-heading\{[\s\S]*?text-overflow:ellipsis;white-space:nowrap/);
 assert.match(css,/\.smn-registry-count svg\{[\s\S]*?width:29px;height:29px/);
 assert.match(css,/table-layout:fixed/);
});
