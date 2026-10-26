import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {
 presenceFromCapacity,presenceFromSnapshot,totalSprintDevelopmentJh
} from "../src/lib/sprint-presence";

describe("Fiche Sprint : total de développement depuis les membres déjà calculés",()=>{
 it("reprend les cinq membres visibles sans appliquer les pourcentages deux fois",()=>{
  const values=[0,0,10,10,5].map((developmentJh,i)=>({
   memberId:String(i),displayName:"Membre "+i,presenceJh:i===0?5:10,
   developmentJh,daysCount:10,unknownDays:0
  }));
  assert.equal(totalSprintDevelopmentJh(values),25);
  assert.equal(values.reduce((sum,m)=>sum+(m.presenceJh??0),0),45);
 });
 it("ne transforme pas les valeurs inconnues en zéro, y compris sur une liste vide",()=>{
  assert.equal(totalSprintDevelopmentJh([]),null);
  assert.equal(totalSprintDevelopmentJh([{developmentJh:10},{developmentJh:null}]),null);
  assert.equal(totalSprintDevelopmentJh([{developmentJh:0},{developmentJh:0}]),0);
 });
 it("arrondit la somme une seule fois à quatre décimales",()=>{
  assert.equal(totalSprintDevelopmentJh([
   {developmentJh:0.1},{developmentJh:0.2},{developmentJh:1.12345}
  ]),1.4235);
 });
 it("reste identique pour la projection active et le snapshot clôturé",()=>{
  const current=presenceFromCapacity({hoursPerJh:8,members:[{
   memberId:"developer",displayName:"Développeur",totalJh:3.5,
   days:[{status:"calculated",availableHalfDays:2}]
  },{
   memberId:"product",displayName:"PO",totalJh:0,
   days:[{status:"calculated",availableHalfDays:1}]
  }]});
  const closed=presenceFromSnapshot(current,1);
  assert.equal(totalSprintDevelopmentJh(current.members),3.5);
  assert.equal(closed.state,"available");
  if(closed.state==="available"){
   assert.equal(closed.source,"closure-snapshot");
   assert.equal(totalSprintDevelopmentJh(closed.members),3.5);
  }
 });
 it("rend exactement trois tuiles, masque le total non autorisé et traduit FR/EN",()=>{
  const read=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
  const component=read("src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx");
  const fr=JSON.parse(read("src/i18n/fr.json")) as {sprintDetail:Record<string,string>};
  const en=JSON.parse(read("src/i18n/en.json")) as {sprintDetail:Record<string,string>};
  assert.match(component,/if\(!canViewNames\)return/);
  assert.match(component,/totalSprintDevelopmentJh\(data\.members\)/);
  assert.match(component,/t\("sprintDetail\.presenceDevelopmentTotal"\)/);
  assert.equal((component.match(/className="col-12 col-md-6 col-xl-4"/g)??[]).length,3);
  assert.equal(fr.sprintDetail.presenceDevelopmentTotal,"Capacité totale de développement estimée");
  assert.equal(en.sprintDetail.presenceDevelopmentTotal,"Estimated total development capacity");
 });
});
