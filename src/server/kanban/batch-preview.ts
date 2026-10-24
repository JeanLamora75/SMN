import {nextDay,periodFromStart} from "./dates";
import type {KanbanFrequency} from "./cadence";
export type ExistingPeriod={id:string;startOn:string;endOn:string};
export function batchPreview(startOn:string,quantity:number,frequency:KanbanFrequency,existing:ExistingPeriod[]){
 if(!Number.isInteger(quantity)||quantity<1||quantity>6)throw Error("invalid-quantity");
 const items:({name:string;startOn:string;endOn:string;conflicts:string[]})[]=[];
 let cursor=startOn;
 for(let i=0;i<quantity;i++){
  const period=periodFromStart(cursor,frequency);
  const conflicts=existing.filter(item=>item.startOn<=period.endOn&&item.endOn>=period.startOn).map(item=>item.id);
  for(let j=0;j<items.length;j++){
   if(items[j].startOn<=period.endOn&&items[j].endOn>=period.startOn){conflicts.push("proposal-"+(j+1));items[j].conflicts.push("proposal-"+(i+1));}
  }
  items.push({...period,conflicts});
  cursor=nextDay(period.endOn);
 }
 return {items,canConfirm:items.every(x=>x.conflicts.length===0)};
}
