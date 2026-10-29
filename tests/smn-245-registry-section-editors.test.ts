import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("la fiche reste en lecture mais les crayons ouvrent le formulaire complet dans une modale",()=>{
 const ui=read("src/app/app/admin/registries/registry-detail.tsx");
 assert.ok(!ui.includes("<RegistryCreate "));
 assert.ok(ui.includes("setFullEditing(true)"));
 assert.ok(ui.includes("RegistryEditModal"));
 assert.ok(read("src/app/app/admin/registries/registry-edit-modal.tsx").includes("<RegistryCreate"));
 assert.ok(ui.includes("RegistryDescriptionEditor"));
 assert.ok(ui.includes("canManage&&"));
});
test("modale générique : vraie modale native, clavier/Escape, focus restauré, confirmation si brouillon modifié",()=>{
 const ui=read("src/app/app/admin/registries/registry-section-dialog.tsx");
 for(const x of ["<dialog","showModal()","onCancel","onClose","onChangeCapture","aria-labelledby","confirm(","focus()"])
  assert.ok(ui.includes(x),x);
 assert.ok(ui.includes('onDismiss'));
});
test("informations générales groupées, pas de changement implicite de statut",()=>{
 const ui=read("src/app/app/admin/registries/registry-core-editor.tsx");
 assert.ok(ui.includes('section==="general"'));
 for(const x of ["title","occurredOn","owner","dueOn"])assert.ok(ui.includes(x));
 assert.ok(ui.includes("item.status"));
 assert.ok(ui.includes("item.description"));
 assert.ok(ui.includes("item.comment"));
});
test("statut : valeurs réelles, contrôle de transition backend et révision optimiste",()=>{
 const ui=read("src/app/app/admin/registries/registry-core-editor.tsx");
 assert.ok(ui.includes("registryStatuses[item.type]"));
 assert.ok(ui.includes("obstacleTransition"));
 assert.ok(ui.includes("revision:item.revision"));
 assert.ok(ui.includes('method:"PATCH"'));
 assert.ok(ui.includes('response.status===409'));
 assert.ok(ui.includes('response.status===503'));
 assert.ok(ui.includes('result.ok'));
 assert.ok(!ui.includes("setDraft(null)"));
});
test("les composants métier réutilisent leurs lecteurs et mutations auditées dans des modales distinctes",()=>{
 const ui=read("src/app/app/admin/registries/registry-detail.tsx");
 for(const name of ["RiskAssessment","RiskRoam","DependencyParties","DependencyVigilance","DecisionDetail","RegistryRelations","RegistryCycles","ActionLinks"])
  assert.ok(ui.includes("<"+name),name);
 for(const name of ["riskAssessment","riskRoam","dependencyParties","dependencyVigilance","decisionDetail","registryRelations","registryCycles","actionLinks"])
  assert.ok(ui.includes('"'+name+'"'),name);
 assert.ok(ui.includes("canManage={true}"));
 assert.ok(ui.includes("onSaved={businessUpdated}"));
});
test("aucune commande d'écriture au lecteur collectif, même depuis une URL directe",()=>{
 const ui=read("src/app/app/admin/registries/registry-detail.tsx");
 const api=read("src/app/api/admin/registries/[id]/route.ts");
 assert.ok(ui.includes("canManage&&fullEditing"));
 assert.ok(ui.includes("canManage&&businessEditing"));
 assert.ok(api.includes('authorizeApi(req,"write"'));
});
test("la sauvegarde actualise la fiche uniquement après réponse confirmée",()=>{
 const ui=read("src/app/app/admin/registries/registry-core-editor.tsx");
 const detail=read("src/app/app/admin/registries/registry-detail.tsx");
 assert.ok(ui.includes('if(!response.ok)throw Error("save-failed")'));
 assert.ok(ui.includes('if(!result.ok||typeof result.revision!=="number"'));
 assert.ok(ui.includes("onSaved()"));
 assert.ok(detail.includes("retry();"));
});
test("FR/EN et CSS : modales compactes + champs sur une ligne et pas de largeur imposée mobile",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).registryEdit;
 const en=JSON.parse(read("src/i18n/en.json")).registryEdit;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const k of ["general","status","riskAssessment","riskRoam","dependencyParties","dependencyVigilance","decisionDetail","registryRelations","registryCycles","actionLinks","discard","conflict","unavailable"])assert.ok(fr[k]&&en[k],k);
 const css=read("src/app/globals.css");
 assert.ok(css.includes(".smn-registry-section-dialog"));
 assert.ok(css.includes("@media(max-width:575px)"));
});
