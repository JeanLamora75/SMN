export type KanbanOccurrence={
 id:string;startsAt:string;endsAt:string;status:string;
 origin:"generated"|"manual"|"exceptional";customized:boolean;
};
export function movableKanbanOccurrence(item:KanbanOccurrence,now:string):boolean{
 const start=Date.parse(item.startsAt),end=Date.parse(item.endsAt);
 return item.origin==="generated"&&!item.customized&&
  item.status==="planned"&&Number.isFinite(start)&&Number.isFinite(end)&&end>start&&start>Date.parse(now);
}
export function inspectKanbanEvents(items:KanbanOccurrence[],nextStartOn:string,nextEndOn:string,now:string){
 const protectedOccurrences=items.filter(x=>!movableKanbanOccurrence(x,now));
 const outside=items.filter(x=>{
  const d=x.startsAt.slice(0,10);
  return d<nextStartOn||d>nextEndOn;
 }).map(x=>x.id);
 return {outside,protectedIds:protectedOccurrences.map(x=>x.id),
  eligibleIds:items.filter(x=>movableKanbanOccurrence(x,now)).map(x=>x.id)};
}
