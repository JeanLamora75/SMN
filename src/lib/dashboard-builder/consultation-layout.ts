import type {DashboardBlock,DashboardSlot} from "@/server/dashboard-builder/layout";
import {getDashboardTemplate} from "./templates";

function hasContent(slot:DashboardSlot):boolean{
 return typeof slot.source==="string"&&slot.source.length>0&&
        typeof slot.view==="string"&&slot.view.length>0;
}
export function visibleSlots(block:DashboardBlock){
 return block.slots.filter(hasContent);
}
export function gridColumns(block:DashboardBlock):string{
 const template=getDashboardTemplate(block.templateId,block.templateVersion);
 if(!template)return "minmax(0,1fr)";
 const active=template.slots.filter(cell=>block.slots.some(s=>s.templateSlotId===cell.slotId&&hasContent(s)));
 return active.length?active.map(cell=>`${cell.columnSpan}fr`).join(" "):"minmax(0,1fr)";
}
