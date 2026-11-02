import type {DashboardBlock,DashboardLayout} from "@/server/dashboard-builder/layout";
import {requireCreatableDashboardTemplate,type DashboardTemplateId} from "@/lib/dashboard-builder/templates";

/** Pure draft operations; no writes or automatic source configuration. */
export function appendDashboardRow(layout:DashboardLayout,id:string):DashboardLayout {
 if(!id||layout.rows.some(row=>row.id===id))throw Error("dashboard-row-id-invalid");
 return {...layout,rows:[...layout.rows,{id,blocks:[]}]};
}
export function appendDashboardBlock(layout:DashboardLayout,rowId:string,templateId:DashboardTemplateId,
 ids:{blockId:string;slotIds:readonly string[]}):DashboardLayout {
 const template=requireCreatableDashboardTemplate(templateId);
 if(ids.slotIds.length!==template.slotCount||!ids.blockId||new Set(ids.slotIds).size!==ids.slotIds.length)throw Error("dashboard-block-ids-invalid");
 const currentIds=new Set([...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)].flatMap(b=>[b.id,...b.slots.map(s=>s.id)]).concat(layout.rows.map(r=>r.id)));
 if([ids.blockId,...ids.slotIds].some(id=>!id||currentIds.has(id)))throw Error("dashboard-block-ids-invalid");
 let found=false;
 const rows=layout.rows.map(row=>{
  if(row.id!==rowId)return row;
  found=true;
  const block:DashboardBlock={id:ids.blockId,templateId:template.id,templateVersion:template.version,
   slots:template.slots.map((s,i)=>({id:ids.slotIds[i],templateSlotId:s.slotId}))};
  return {...row,blocks:[...row.blocks,block]};
 });
 if(!found)throw Error("dashboard-row-not-found");
 return {...layout,rows};
}
