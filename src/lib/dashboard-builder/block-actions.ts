import type {DashboardBlock,DashboardLayout,DashboardSlot} from "@/server/dashboard-builder/layout";
import {requireCreatableDashboardTemplate,type DashboardTemplateId} from "./templates";
import {deleteDashboardBlock,deleteDashboardRow} from "./reorder";

const configured=(slot:DashboardSlot)=>!!slot.source||!!slot.view||!!slot.title?.trim();
export function blockHasConfiguredContent(block:DashboardBlock):boolean{
 return !!block.title?.trim()||block.slots.some(configured);
}
export function rowHasConfiguredContent(layout:DashboardLayout,rowId:string):boolean{
 const row=layout.rows.find(r=>r.id===rowId);
 if(!row)throw Error("dashboard-row-not-found");
 return row.blocks.some(blockHasConfiguredContent);
}
export function duplicateDashboardBlock(layout:DashboardLayout,blockId:string,newBlockId:string,newSlotIds:readonly string[]):DashboardLayout{
 const used=new Set([...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)].flatMap(b=>[b.id,...b.slots.map(s=>s.id)]).concat(layout.rows.map(r=>r.id)));
 const row=layout.rows.find(r=>r.blocks.some(b=>b.id===blockId));
 const original=row?.blocks.find(b=>b.id===blockId);
 if(!row||!original)throw Error("dashboard-block-not-found");
 if(newSlotIds.length!==original.slots.length||!newBlockId||[newBlockId,...newSlotIds].some(id=>!id||used.has(id))||
 new Set([newBlockId,...newSlotIds]).size!==newSlotIds.length+1)throw Error("dashboard-block-ids-invalid");
 const replica:DashboardBlock={...structuredClone(original),id:newBlockId,
  slots:original.slots.map((s,i)=>({...structuredClone(s),id:newSlotIds[i]}))};
 return {...layout,rows:layout.rows.map(r=>r.id!==row.id?r:{...r,blocks:r.blocks.flatMap(b=>b.id===blockId?[b,replica]:[b])})};
}
export function changeDashboardBlockTemplate(layout:DashboardLayout,blockId:string,target:DashboardTemplateId,newIds:readonly string[]):{
 layout:DashboardLayout;lostConfigured:number
}{
 const model=requireCreatableDashboardTemplate(target);
 const row=layout.rows.find(r=>r.blocks.some(b=>b.id===blockId));
 const original=row?.blocks.find(b=>b.id===blockId);
 if(!original||!row)throw Error("dashboard-block-not-found");
 const kept=original.slots.slice(0,model.slotCount);
 const lostConfigured=original.slots.slice(model.slotCount).filter(configured).length;
 const missing=model.slotCount-kept.length;
 const allIds=new Set([...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)].flatMap(b=>[b.id,...b.slots.map(s=>s.id)]).concat(layout.rows.map(r=>r.id)));
 if(newIds.length!==missing||new Set(newIds).size!==missing||newIds.some(id=>!id||allIds.has(id)))throw Error("dashboard-block-ids-invalid");
 const slots=model.slots.map((cell,index)=>index<kept.length?
  {...kept[index],templateSlotId:cell.slotId}:{id:newIds[index-kept.length],templateSlotId:cell.slotId});
 const replaced:DashboardBlock={...original,templateId:model.id,templateVersion:model.version,slots};
 return {lostConfigured,layout:{...layout,rows:layout.rows.map(r=>r.id!==row.id?r:
  {...r,blocks:r.blocks.map(b=>b.id===blockId?replaced:b)})}};
}
export function removeDashboardBlock(layout:DashboardLayout,id:string,confirmed=false):DashboardLayout{
 const block=layout.rows.flatMap(r=>r.blocks).find(b=>b.id===id);
 if(!block)throw Error("dashboard-block-not-found");
 if(blockHasConfiguredContent(block)&&!confirmed)throw Error("dashboard-delete-confirmation-required");
 return deleteDashboardBlock(layout,id);
}
export function removeDashboardRow(layout:DashboardLayout,id:string,confirmed=false):DashboardLayout{
 if(rowHasConfiguredContent(layout,id)&&!confirmed)throw Error("dashboard-delete-confirmation-required");
 return deleteDashboardRow(layout,id);
}
