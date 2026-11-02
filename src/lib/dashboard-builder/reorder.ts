import type {DashboardLayout} from "@/server/dashboard-builder/layout";

/** Pure immutable reordering: existing row, block and slot objects are retained. */
export function moveDashboardRow(layout:DashboardLayout,rowId:string,toIndex:number):DashboardLayout{
 const from=layout.rows.findIndex(row=>row.id===rowId);
 if(from<0||!Number.isInteger(toIndex)||toIndex<0||toIndex>=layout.rows.length)throw Error("dashboard-row-move-invalid");
 if(from===toIndex)return layout;
 const rows=[...layout.rows];
 const [row]=rows.splice(from,1);
 rows.splice(toIndex,0,row);
 return {...layout,rows};
}
export function moveDashboardBlock(layout:DashboardLayout,blockId:string,targetRowId:string,toIndex:number):DashboardLayout{
 const sourceRow=layout.rows.find(row=>row.blocks.some(b=>b.id===blockId));
 const targetRow=layout.rows.find(row=>row.id===targetRowId);
 if(!sourceRow||!targetRow||!Number.isInteger(toIndex)||toIndex<0||
    toIndex>targetRow.blocks.length)throw Error("dashboard-block-move-invalid");
 const block=sourceRow.blocks.find(b=>b.id===blockId)!;
 const filtered=sourceRow.blocks.filter(b=>b.id!==blockId);
 const same=sourceRow.id===targetRowId;
 const destination=same?filtered:[...targetRow.blocks];
 const adjusted=same?Math.min(toIndex,destination.length):toIndex;
 if(same&&sourceRow.blocks.indexOf(block)===adjusted)return layout;
 destination.splice(adjusted,0,block);
 return {...layout,rows:layout.rows.map(row=>{
  if(row.id===sourceRow.id)return {...row,blocks:destinationIfSame(same,destination,filtered)};
  if(row.id===targetRowId)return {...row,blocks:destination};
  return row;
 })};
}
function destinationIfSame(same:boolean,destination:DashboardLayout["rows"][number]["blocks"],filtered:DashboardLayout["rows"][number]["blocks"]){
 return same?destination:filtered;
}
export function deleteDashboardRow(layout:DashboardLayout,rowId:string):DashboardLayout{
 if(!layout.rows.some(row=>row.id===rowId))throw Error("dashboard-row-not-found");
 return {...layout,rows:layout.rows.filter(row=>row.id!==rowId)};
}
export function deleteDashboardBlock(layout:DashboardLayout,blockId:string):DashboardLayout{
 if(!layout.rows.some(r=>r.blocks.some(b=>b.id===blockId)))throw Error("dashboard-block-not-found");
 return {...layout,rows:layout.rows.map(r=>({...r,blocks:r.blocks.filter(b=>b.id!==blockId)}))};
}
