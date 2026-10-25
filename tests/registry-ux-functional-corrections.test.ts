import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {formatRegistryDate} from "../src/lib/registry-date";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const ui=(name:string)=>read("src/app/app/admin/registries/"+name);

test("dates civiles du registre : lisibles, localisées, sans décalage de jour",()=>{
 assert.equal(formatRegistryDate("2026-10-24","fr"),"24 oct. 2026");
 assert.equal(formatRegistryDate("2026-10-24","en"),"24 Oct 2026");
 assert.equal(formatRegistryDate("2026-02-30","fr"),"2026-02-30");
 assert.equal(formatRegistryDate(null,"fr"),"");
 for(const name of ["registry-list-row.tsx","registry-card.tsx"]){
  assert.match(ui(name),/formatRegistryDate\(item\.occurredOn,locale\)/);
  assert.match(ui(name),/formatRegistryDate\(item\.dueOn,locale\)/);
  assert.match(ui(name),/<time dateTime=\{item\.occurredOn\}>/);
 }
});

test("création : bouton actif, formulaire complet dans une vraie modale",()=>{
 const list=ui("registry-list.tsx"),modal=ui("registry-create-modal.tsx");
 assert.match(list,/onClick=\{\(\)=>setCreateOpen\(true\)\}/);
 assert.match(list,/canManage&&createOpen&&<RegistryCreateModal/);
 assert.match(modal,/RegistryDialogPortal/);
 assert.match(modal,/useRegistryPortalReady/);
 assert.match(modal,/showModal\(\)/);
 assert.match(modal,/onCancel=\{cancel\}/);
 assert.match(modal,/method:"POST"/);
 for(const field of ["probability","impact","roam","requester","contributor","rationale"])
  assert.ok(modal.includes(field),field);
});

test("édition : la fiche, le statut, les sections risque/ROAM/relations et le menu ouvrent le formulaire complet",()=>{
 const list=ui("registry-list.tsx"),detail=ui("registry-detail.tsx");
 const modal=ui("registry-edit-modal.tsx");
 assert.match(modal,/<RegistryCreate /);
 assert.match(modal,/modalMode onSaved=\{onSaved\}/);
 assert.match(modal,/itemId=\{id\}/);
 assert.match(detail,/canManage&&fullEditing&&<RegistryEditModal/);
 assert.match(detail,/section==="riskAssessment"\|\|section==="riskRoam"\|\|section==="registryRelations"\?setFullEditing\(true\)/);
 assert.ok((detail.match(/setFullEditing\(true\)/g)||[]).length>=3);
 assert.match(list,/canManage&&editingId&&<RegistryEditModal/);
 for(const name of ["registry-list-row.tsx","registry-card.tsx"]){
  assert.match(ui(name),/onEdit\(\)/);
  assert.match(ui(name),/type="button" className="smn-registry-row-menu-link/);
 }
});

test("filtres réactifs : sélections immédiates, recherche temporisée et reset réexécuté",()=>{
 const list=ui("registry-list.tsx");
 for(const part of ["lifecycle","cycleId","status","sort"])
  assert.match(list,new RegExp("onChange=\\{e=>apply\\(\\{"+part+":"));
 assert.match(list,/window\.setTimeout\(/);
 assert.match(list,/setQuery\(old=>\(\{\.\.\.old,search,owner\}\)\)/);
 assert.match(list,/setRefresh\(n=>n\+1\)/);
 assert.match(list,/setQuery\(\{\.\.\.draft,search:draft\.search\.trim\(\)/);
});

test("les modales rendent dans le body pour éviter les contextes CSS bloquants",()=>{
 const portal=ui("registry-dialog-portal.tsx");
 assert.match(portal,/createPortal\(children,document\.body\)/);
 assert.match(portal,/useSyncExternalStore\(subscribe,onClient,onServer\)/);
 assert.match(ui("registry-section-dialog.tsx"),/\[portalReady\]/);
 assert.match(ui("registry-create-modal.tsx"),/\[portalReady\]/);
});
