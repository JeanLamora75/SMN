import assert from "node:assert/strict";
import type {Client} from "pg";
import {test} from "node:test";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {listCreatableDashboardTemplates,getDashboardTemplate} from "../src/lib/dashboard-builder/templates";
import {appendDashboardRow,appendDashboardBlock} from "../src/lib/dashboard-builder/composition";
import {updateDashboardSlot,normalizeSlotOptions} from "../src/lib/dashboard-builder/slot-options";
import {updateBlockDimensions} from "../src/lib/dashboard-builder/dimensions";
import {changeDashboardBlockTemplate,duplicateDashboardBlock,removeDashboardBlock} from "../src/lib/dashboard-builder/block-actions";
import {visibleSlots,gridColumns} from "../src/lib/dashboard-builder/consultation-layout";
import {prepareDashboardCopy,copySavedDashboard} from "../src/server/dashboard-builder/copy";
import {dashboardPermission,requireDashboardPermission} from "../src/server/dashboard-builder/permissions";

test("P1 Dashboard M01–M06: chacune des six maquettes conserve une géométrie complète et unique",()=>{
 const models=listCreatableDashboardTemplates();
 assert.deepEqual(models.map(m=>m.id),["M01","M02","M03","M04","M05","M06"]);
 for(const model of models){
  const layout=createDefaultDashboardLayout("scrum");
  const added=appendDashboardBlock(layout,layout.rows[0].id,model.id,{
   blockId:"new-"+model.id,slotIds:model.slots.map((_,i)=>"new-"+model.id+"-slot-"+i)
  });
  const block=added.rows[0].blocks.at(-1)!;
  assert.equal(block.slots.length,model.slotCount);
  assert.deepEqual(block.slots.map(s=>s.templateSlotId),model.slots.map(s=>s.slotId));
  assert.equal(model.thumbnail.length,model.rows);
  assert.ok(model.thumbnail.every(row=>row.length===model.columns));
  assert.equal(model.slots.reduce((sum,cell)=>sum+cell.columnSpan*cell.rowSpan,0),model.rows*model.columns);
  assert.doesNotThrow(()=>validateDashboardLayout(added));
  assert.equal(visibleSlots(block).length,0);
  assert.equal(layout.rows[0].blocks.length+1,added.rows[0].blocks.length);
  assert.ok(getDashboardTemplate(model.id,model.version));
 }
});

test("P1 Dashboard: assistant sur un emplacement modifie uniquement le brouillon et jamais la disposition source",()=>{
 const published=createDefaultDashboardLayout("scrum");
 const original=structuredClone(published);
 const slot=published.rows[0].blocks[0].slots[0];
 const options=normalizeSlotOptions({cycleIdOverride:"sprint-one"},"indicator",["sprint-one"]);
 const draft=updateDashboardSlot(published,slot.id,{source:"indicator:velocity",view:"number",filters:options});
 assert.deepEqual(published,original);
 assert.equal(visibleSlots(published.rows[0].blocks[0]).length,0);
 assert.equal(visibleSlots(draft.rows[0].blocks[0]).length,1);
 assert.equal(draft.rows[0].blocks[0].slots[0].filters?.cycleIdOverride,"sprint-one");
 assert.deepEqual(draft.rows[0].blocks[1],published.rows[0].blocks[1]);
 assert.doesNotThrow(()=>validateDashboardLayout(draft));
 const canceled=published;
 assert.deepEqual(canceled,original,"Annuler conserve la version publiée");
});

test("P1 Dashboard: retour aux sources et vidage de l'emplacement restaurent une configuration vide",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 const id=layout.header.blocks[0].slots[0].id;
 const changed=updateDashboardSlot(layout,id,{source:"indicator:one",view:"gauge",filters:{}});
 const cleared=updateDashboardSlot(changed,id,null);
 assert.deepEqual(cleared,layout);
 assert.deepEqual(visibleSlots(cleared.header.blocks[0]),[]);
 assert.throws(()=>updateDashboardSlot(layout,"unknown",null),/dashboard-slot-not-found/);
});

test("P1 Dashboard: les options rejettent la référence à un sprint étranger et les entrées de liste invalides",()=>{
 assert.throws(()=>normalizeSlotOptions({cycleIdOverride:"foreign"},"indicator",["mine"]),/forbidden/);
 assert.throws(()=>normalizeSlotOptions({limit:1},"indicator",[]),/incompatible/);
 assert.throws(()=>normalizeSlotOptions({limit:0},"registry",[]),/invalid/);
 assert.throws(()=>normalizeSlotOptions({limit:101},"registry",[]),/invalid/);
 assert.throws(()=>normalizeSlotOptions({columns:["label","../../secret"]},"registry",[]),/invalid/);
 assert.deepEqual(normalizeSlotOptions({limit:10,columns:["label","label","date"],type:"risk",showClosed:true},"registry",[]),
  {type:"risk",showClosed:true,limit:10,columns:["label","date"]});
});

test("P1 Dashboard: titre et dimensions restent isolés dans le bloc modifié",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 const id=layout.rows[0].blocks[0].id;
 const resized=updateBlockDimensions(layout,id,{width:3,height:400});
 assert.deepEqual(resized.rows[0].blocks[0].dimensions,{width:3,height:400});
 assert.equal(layout.rows[0].blocks[0].dimensions,undefined);
 assert.equal(resized.rows[0].blocks[1].dimensions,undefined);
 assert.throws(()=>updateBlockDimensions(layout,id,{width:4,height:999} as never),/invalid/);
 assert.doesNotThrow(()=>validateDashboardLayout(resized));
});

test("P1 Dashboard: réduction de modèle annonce les données perdues et conserve l'emplacement prioritaire",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 const block=layout.rows[0].blocks[0];
 const expanded=changeDashboardBlockTemplate(layout,block.id,"M03",["slot-two","slot-three"]).layout;
 const filled=updateDashboardSlot(expanded,"slot-three",{source:"indicator:lost",view:"number",filters:{}});
 const retained=updateDashboardSlot(filled,block.slots[0].id,{source:"indicator:keep",view:"number",filters:{}});
 const reduced=changeDashboardBlockTemplate(retained,block.id,"M01",[]);
 assert.equal(reduced.lostConfigured,1,"La confirmation doit avertir d'une perte de données");
 assert.equal(reduced.layout.rows[0].blocks[0].slots[0].source,"indicator:keep");
 assert.equal(retained.rows[0].blocks[0].slots.length,3);
 assert.doesNotThrow(()=>validateDashboardLayout(reduced.layout));
});

test("P1 Dashboard: suppression d'un bloc configuré exige une confirmation explicite",()=>{
 const layout=createDefaultDashboardLayout("kanban");
 const id=layout.rows[0].blocks[0].id;
 const sourceSlot=layout.rows[0].blocks[0].slots[0].id;
 const draft=updateDashboardSlot(layout,sourceSlot,{source:"indicator:velocity",view:"number",filters:{}});
 assert.throws(()=>removeDashboardBlock(draft,id),/confirmation-required/);
 assert.equal(draft.rows[0].blocks.length,layout.rows[0].blocks.length);
 const confirmed=removeDashboardBlock(draft,id,true);
 assert.equal(confirmed.rows[0].blocks.length,layout.rows[0].blocks.length-1);
 assert.doesNotThrow(()=>validateDashboardLayout(confirmed));
});

test("P1 Dashboard: duplication conserve les données mais refuse de réutiliser les identifiants",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 const block=layout.rows[0].blocks[0];
 const configured=updateDashboardSlot(layout,block.slots[0].id,{
  source:"indicator:velocity",view:"number",filters:{cycleIdOverride:"sprint-one"}
 });
 const copied=duplicateDashboardBlock(configured,block.id,"duplicated",["duplicated-slot"]);
 assert.deepEqual(copied.rows[0].blocks[1].slots[0].filters,{cycleIdOverride:"sprint-one"});
 assert.equal(copied.rows[0].blocks[1].slots[0].source,"indicator:velocity");
 assert.notEqual(copied.rows[0].blocks[1].slots[0].id,configured.rows[0].blocks[0].slots[0].id);
 assert.throws(()=>duplicateDashboardBlock(configured,block.id,block.id,["duplicate-slot"]),/ids-invalid/);
 assert.doesNotThrow(()=>validateDashboardLayout(copied));
});

test("P1 Dashboard: copie interéquipes retire les références de cycles et renouvelle tous les identifiants",()=>{
 const source=createDefaultDashboardLayout("scrum");
 const originalSlot=source.rows[0].blocks[0].slots[0];
 const configured=updateDashboardSlot(source,originalSlot.id,{
  source:"indicator:velocity",view:"number",filters:{cycleIdOverride:"team-a-sprint"}
 });
 const copied=prepareDashboardCopy(configured);
 const originalIds=[...configured.header.blocks,...configured.rows.flatMap(r=>r.blocks)].flatMap(b=>[b.id,...b.slots.map(s=>s.id)]);
 const newIds=[...copied.header.blocks,...copied.rows.flatMap(r=>r.blocks)].flatMap(b=>[b.id,...b.slots.map(s=>s.id)]);
 assert.equal(new Set(newIds).size,newIds.length);
 assert.ok(newIds.every(id=>!originalIds.includes(id)));
 assert.deepEqual(copied.rows[0].blocks[0].slots[0].filters,{});
 assert.equal(copied.rows[0].blocks[0].slots[0].source,"indicator:velocity");
 assert.deepEqual(configured.rows[0].blocks[0].slots[0].filters,{cycleIdOverride:"team-a-sprint"});
 assert.doesNotThrow(()=>validateDashboardLayout(copied));
});

test("P1 Dashboard: listes configurées visibles et modèle de grille cohérent après saisie",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 const created=appendDashboardRow(layout,"new-row");
 const block=appendDashboardBlock(created,"new-row","M02",{
  blockId:"list-block",slotIds:["list-one","list-two"]
 });
 const first=updateDashboardSlot(block,"list-one",{source:"registry:items",view:"list",
  filters:normalizeSlotOptions({type:"risk",limit:5,columns:["label","status"]},"registry",[])});
 const second=updateDashboardSlot(first,"list-two",{source:"notes:sprint",view:"list",
  filters:normalizeSlotOptions({limit:10},"notes",[])});
 const configured=first.rows.at(-1)!.blocks[0];
 assert.equal(visibleSlots(configured).length,1);
 assert.equal(gridColumns(configured),"1fr");
 const complete=second.rows.at(-1)!.blocks[0];
 assert.equal(visibleSlots(complete).length,2);
 assert.equal(gridColumns(complete),"1fr 1fr");
 assert.equal(complete.slots[0].filters?.type,"risk");
 assert.doesNotThrow(()=>validateDashboardLayout(second));
});

test("P1 Dashboard: droits de lecture et d'édition vérifiés dans le périmètre de l'équipe",async()=>{
 const scope={installationId:"singleton",accountId:"account",teamId:"team-a"};
 for(const {role,can_read,can_edit,expected} of [
  {role:"admin",can_read:false,can_edit:false,expected:{canRead:true,canEdit:true}},
  {role:"user",can_read:true,can_edit:false,expected:{canRead:true,canEdit:false}},
  {role:"user",can_read:true,can_edit:true,expected:{canRead:true,canEdit:true}},
  {role:"user",can_read:false,can_edit:true,expected:{canRead:false,canEdit:false}},
 ]){
  const calls:unknown[][]=[];
  const db={query:async(_sql:string,params:unknown[])=>{
   calls.push(params);return {rows:[{role,can_read,can_edit}]};
  }} as unknown as Client;
  assert.deepEqual(await dashboardPermission(db,scope),expected);
  assert.deepEqual(calls,[[scope.installationId,scope.accountId,scope.teamId]]);
  if(!expected.canEdit)await assert.rejects(()=>requireDashboardPermission(db,scope,"edit"),/dashboard-scope-forbidden/);
  if(expected.canRead)await assert.doesNotReject(()=>requireDashboardPermission(db,scope,"read"));
 }
});

test("P1 Dashboard: la copie source non autorisée est rejetée sans écriture",async()=>{
 const scope={installationId:"singleton",accountId:"account",teamId:"team-a"};
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql==="BEGIN"||sql==="ROLLBACK")return {rows:[]};
  if(sql.includes("FROM public.smn_account a"))return {rows:[]};
  throw Error("Unexpected database access");
 }} as unknown as Client;
 await assert.rejects(()=>copySavedDashboard(db,scope,"team-b",0),/dashboard-scope-forbidden/);
 assert.equal(statements[0],"BEGIN");
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.ok(!statements.some(sql=>/\b(?:INSERT|UPDATE|DELETE)\b/i.test(sql)));
});

test("P1 Dashboard: une copie sur une révision périmée est annulée atomiquement",async()=>{
 const scope={installationId:"singleton",accountId:"account",teamId:"team-a"};
 const statements:string[]=[];
 const layout=createDefaultDashboardLayout("scrum");
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(["BEGIN","ROLLBACK"].includes(sql))return {rows:[]};
  if(sql.includes("FROM public.smn_account a"))return {
   rows:[{role:"admin",can_read:false,can_edit:false}]
  };
  if(sql.includes("FROM public.smn_dashboard_layout")&&sql.includes("FOR SHARE"))
   return {rows:[{layout}]};
  if(sql.includes("FROM public.smn_dashboard_layout")&&sql.includes("FOR UPDATE"))
   return {rows:[{revision:"3"}]};
  throw Error("Unexpected database access: "+sql);
 }} as unknown as Client;
 await assert.rejects(()=>copySavedDashboard(db,scope,"team-b",2),/dashboard-revision-conflict/);
 assert.equal(statements[0],"BEGIN");
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.ok(!statements.includes("COMMIT"));
 assert.ok(!statements.some(sql=>/\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+|FROM\s+)?public\./i.test(sql)));
});
