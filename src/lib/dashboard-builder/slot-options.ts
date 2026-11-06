import type {DashboardLayout,DashboardSlot} from "@/server/dashboard-builder/layout";
export type SlotOptions={limit?:number;sort?:"asc"|"desc";columns?:string[];cycleIdOverride?:string;type?:string;showClosed?:boolean;minimum?:number;maximum?:number};
export function normalizeSlotOptions(value:SlotOptions,category:string,cycleIds:readonly string[],view?:string):SlotOptions{
 const next:SlotOptions={};
 if(view==="tachometer"||view==="battery-horizontal"||view==="battery-vertical"||view==="graduated-ring"){
  if(category!=="indicator"||typeof value.minimum!=="number"||typeof value.maximum!=="number"||
   !Number.isFinite(value.minimum)||!Number.isFinite(value.maximum)||value.minimum>=value.maximum)
   throw Error("dashboard-slot-scale-invalid");
  next.minimum=value.minimum;next.maximum=value.maximum;
 }else if(value.minimum!==undefined||value.maximum!==undefined)throw Error("dashboard-slot-option-incompatible");
 if(value.cycleIdOverride){
  if(!cycleIds.includes(value.cycleIdOverride))throw Error("dashboard-slot-cycle-forbidden");
  next.cycleIdOverride=value.cycleIdOverride;
 }
 if(category==="registry"){
  if(value.type!==undefined){if(!["all","risk","obstacle","dependency","highlight","decision","action"].includes(value.type))throw Error("dashboard-slot-option-invalid");next.type=value.type;}
  if(value.showClosed!==undefined){if(typeof value.showClosed!=="boolean")throw Error("dashboard-slot-option-invalid");next.showClosed=value.showClosed;}
 }else if(value.type!==undefined||value.showClosed!==undefined)throw Error("dashboard-slot-option-incompatible");
 if(category==="indicator"){
  if(value.limit!==undefined||value.sort!==undefined||value.columns!==undefined)throw Error("dashboard-slot-option-incompatible");
 }else if(["registry","cycle","calendar","notes","team","link"].includes(category)){
  if(value.limit!==undefined){
   if(!Number.isSafeInteger(value.limit)||value.limit<1||value.limit>100)throw Error("dashboard-slot-option-invalid");
   next.limit=value.limit;
  }
  if(value.sort!==undefined){if(!["asc","desc"].includes(value.sort))throw Error("dashboard-slot-option-invalid");next.sort=value.sort;}
  if(value.columns!==undefined){
   if(!Array.isArray(value.columns)||value.columns.length>12||value.columns.some(c=>typeof c!=="string"||!/^[a-zA-Z0-9_-]{1,60}$/.test(c)))
    throw Error("dashboard-slot-option-invalid");
   next.columns=[...new Set(value.columns)];
  }
 }else if(value.limit!==undefined||value.sort!==undefined||value.columns!==undefined)throw Error("dashboard-slot-option-incompatible");
 return next;
}
export function updateDashboardSlot(layout:DashboardLayout,slotId:string,change:Pick<DashboardSlot,"source"|"view"|"filters">|null):DashboardLayout{
 let count=0;
 const replace=(s:DashboardSlot):DashboardSlot=>{
  if(s.id!==slotId)return s;
  count++;
  return change===null?{id:s.id,templateSlotId:s.templateSlotId}:
   {...s,source:change.source,view:change.view,filters:change.filters};
 };
 const result={...layout,
  header:{blocks:layout.header.blocks.map(b=>({...b,slots:b.slots.map(replace)}))},
  rows:layout.rows.map(r=>({...r,blocks:r.blocks.map(b=>({...b,slots:b.slots.map(replace)}))}))};
 if(count!==1)throw Error("dashboard-slot-not-found");
 return result;
}
