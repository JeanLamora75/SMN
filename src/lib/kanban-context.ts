export type KanbanPeriodContextItem=Readonly<{
 id:string;name:string;status:string;startOn:string;endOn:string;
 timeZone:string;
}>;
const isoDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&
 !Number.isNaN(Date.parse(value+"T12:00:00Z"))&&
 new Date(value+"T12:00:00Z").toISOString().slice(0,10)===value;

function localDate(now:number,zone:string):string{
 const formatter=new Intl.DateTimeFormat("en-GB",{
  timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"
 });
 const parts=formatter.formatToParts(new Date(now));
 const val=(type:string)=>parts.find(part=>part.type===type)?.value??"";
 return val("year")+"-"+val("month")+"-"+val("day");
}

/** Les périodes Kanban sont inclusives, contrairement aux instants Sprint.
 * Ne change jamais les statuts enregistrés et n'invente pas de période.
 */
export function defaultKanbanPeriodId(items:readonly KanbanPeriodContextItem[],
 now=Date.now()):string|null{
 const valid=items.filter(item=>isoDate(item.startOn)&&isoDate(item.endOn)&&
  item.startOn<=item.endOn&&item.status!=="closed"&&
  item.status!=="suspended");
 const current=valid.filter(item=>{
  const today=localDate(now,item.timeZone);
  return item.startOn<=today&&today<=item.endOn;
 }).sort((a,b)=>b.startOn.localeCompare(a.startOn)||a.id.localeCompare(b.id));
 if(current[0])return current[0].id;
 const upcoming=valid.filter(item=>item.startOn>localDate(now,item.timeZone))
  .sort((a,b)=>a.startOn.localeCompare(b.startOn)||a.id.localeCompare(b.id));
 if(upcoming[0])return upcoming[0].id;
 const past=valid.filter(item=>item.endOn<localDate(now,item.timeZone))
  .sort((a,b)=>b.endOn.localeCompare(a.endOn)||a.id.localeCompare(b.id));
 return past[0]?.id??items[0]?.id??null;
}
