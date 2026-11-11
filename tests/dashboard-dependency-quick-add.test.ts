import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {parseRegistryInput} from "../src/server/registries/items";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const cycleId="11111111-1111-4111-8111-111111111111";

describe("Dashboard — création directe d'une dépendance",()=>{
 it("rend le bouton dans la liste dédiée et dans les listes mixtes",()=>{
  const dashboard=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
  assert.match(dashboard,/\["all","risk","obstacle","dependency"\]/);
  assert.match(dashboard,/kind="dependencies"/);
  assert.match(dashboard,/\+ Ajouter une dépendance/);
  assert.match(dashboard,/slot\.filters\?\.type==="dependency"\?"dependencies"/);
 });
 it("ouvre la fiche métier et verrouille son type",()=>{
  const quick=read("src/app/app/operational-quick-add.tsx");
  const modal=read("src/app/app/admin/registries/registry-create-modal.tsx");
  assert.match(quick,/kind==="dependencies"/);
  assert.match(quick,/initialType="dependency" restrictedTypes=\{\["dependency"\]\}/);
  assert.match(quick,/onCreated=\{\(\)=>\{setOpened\(false\);onSaved\?\.\(\);\}\}/);
  assert.match(modal,/type==="dependency"\)\&\&cycleId/);
  assert.match(modal,/requesterKind/);
  assert.match(modal,/contributorKind/);
  assert.match(modal,/atRisk/);
 });
 it("accepte une liaison sprint pour une dépendance et refuse les autres types non pris en charge",()=>{
  const base={title:"Dépendance test",teamId:"team-one",occurredOn:"2026-11-11",
   status:"open",description:null,owner:null,dueOn:null,comment:null,cycleId};
  assert.ok(parseRegistryInput({...base,type:"dependency"}));
  assert.equal(parseRegistryInput({...base,type:"decision"}),null);
 });
});
