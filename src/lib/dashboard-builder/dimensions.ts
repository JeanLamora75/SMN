import type {DashboardLayout,DashboardBlock} from "@/server/dashboard-builder/layout";
export type BlockDimensions=Readonly<{width:1|2|3|4;height:"auto"|240|320|400|480|640}>;
export const DEFAULT_BLOCK_DIMENSIONS:BlockDimensions={width:1,height:"auto"};
export function validateBlockDimensions(value:unknown):BlockDimensions{
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("dashboard-dimensions-invalid");
 const v=value as Record<string,unknown>;
 if(![1,2,3,4].includes(v.width as number)||!["auto",240,320,400,480,640].includes(v.height as string|number)||
 Object.keys(v).some(key=>!["width","height"].includes(key)))throw Error("dashboard-dimensions-invalid");
 return {width:v.width as BlockDimensions["width"],height:v.height as BlockDimensions["height"]};
}
export function updateBlockDimensions(layout:DashboardLayout,id:string,dimensions:BlockDimensions):DashboardLayout{
 const validated=validateBlockDimensions(dimensions);
 let count=0;
 const change=(block:DashboardBlock):DashboardBlock=>{
  if(block.id!==id)return block;
  count++;
  return {...block,dimensions:validated};
 };
 const next={...layout,header:{blocks:layout.header.blocks.map(change)},
  rows:layout.rows.map(row=>({...row,blocks:row.blocks.map(change)}))};
 if(count!==1)throw Error("dashboard-block-not-found");
 return next;
}
