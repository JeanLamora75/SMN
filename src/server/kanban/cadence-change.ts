import {periodFromStart,nextDay} from "./dates";
import type {KanbanFrequency} from "./cadence";
export type FuturePeriod={id:string;name:string;startOn:string;endOn:string;status:string;timeZone:string};
export function cadenceChangeProposal(periods:FuturePeriod[],frequency:KanbanFrequency,today:string){
 const future=periods.filter(p=>p.status==="planned"&&p.startOn>today).sort((a,b)=>a.startOn.localeCompare(b.startOn)||a.id.localeCompare(b.id));
 const protectedPeriods=periods.filter(p=>!future.some(f=>f.id===p.id));
 let cursor=future[0]?.startOn??"";
 const changes=future.map(period=>{
  const next=periodFromStart(cursor,frequency);
  cursor=nextDay(next.endOn);
  const conflicts=protectedPeriods.filter(p=>p.startOn<=next.endOn&&p.endOn>=next.startOn).map(p=>p.id);
  return {id:period.id,previous:{startOn:period.startOn,endOn:period.endOn,name:period.name},
   proposed:{startOn:next.startOn,endOn:next.endOn,name:period.name},conflicts};
 });
 return {changes,canConfirm:changes.length>0&&changes.every(c=>c.conflicts.length===0)};
}
