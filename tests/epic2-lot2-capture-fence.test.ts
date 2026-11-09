import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {captureFenceUnchanged,type CaptureFence}
 from "../src/server/backup/capture-fence";

const base:CaptureFence={
 walLsn:"0/1AB2C",
 documents:[{name:"doc1.txt",hash:"a".repeat(64),length:128}],
 archives:{
  pdf:[{name:"11111111-1111-4111-8111-111111111111.pdf",hash:"b".repeat(64),size:256}],
  office:[{name:"Rapport.docx",hash:"c".repeat(64),size:300}],
  templates:[{name:"Modele.pptx",hash:"d".repeat(64),size:400}]
 }
};
describe("Epic 2 lot 2 — clôture conservatrice du périmètre DB/fichiers",()=>{
 it("n'accepte que des sources inchangées avec WAL valide",()=>{
  assert.equal(captureFenceUnchanged(base,structuredClone(base)),true);
  assert.equal(captureFenceUnchanged({...base,walLsn:""},base),false);
  assert.equal(captureFenceUnchanged(base,{...base,walLsn:"0/1AB2D"}),false);
 });
 it("refuse toute modification des documents privés",()=>{
  assert.equal(captureFenceUnchanged(base,{...base,
   documents:[{...base.documents[0],hash:"f".repeat(64)}]}),false);
 });
 it("refuse une archive PDF manquante ou des rapports Office modifiés",()=>{
  assert.equal(captureFenceUnchanged(base,{...base,archives:{...base.archives,pdf:[]}}),false);
  assert.equal(captureFenceUnchanged(base,{...base,archives:{...base.archives,
   office:[{...base.archives.office[0],size:301}]}}),false);
 });
 it("refuse un modèle Office modifié ou nouvellement ajouté",()=>{
  assert.equal(captureFenceUnchanged(base,{...base,archives:{...base.archives,
   templates:[{...base.archives.templates[0],hash:"e".repeat(64)}]}}),false);
  assert.equal(captureFenceUnchanged(base,{...base,archives:{...base.archives,
   templates:[...base.archives.templates,{name:"Autre.docx",hash:"d".repeat(64),size:60}]}}),false);
 });
});
