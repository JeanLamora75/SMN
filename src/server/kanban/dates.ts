import type {KanbanFrequency} from "./cadence";
export function nextDay(date:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error("invalid-date");
 const parsed=new Date(date+"T00:00:00Z");
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw Error("invalid-date");
 parsed.setUTCDate(parsed.getUTCDate()+1);
 return parsed.toISOString().slice(0,10);
}
export function periodFromStart(startOn:string,frequency:KanbanFrequency){
 const next=nextDay(startOn);
 const start=new Date(startOn+"T00:00:00Z");
 let end:Date;
 if(frequency==="monthly"){
  if(start.getUTCDate()!==1)throw Error("monthly-start-must-be-first");
  end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0));
 }else{
  end=new Date(next+"T00:00:00Z");
  end.setUTCDate(end.getUTCDate()+(frequency==="weekly"?5:12));
 }
 const endOn=end.toISOString().slice(0,10);
 return {startOn,endOn,name:`Kanban ${startOn} — ${endOn}`};
}
