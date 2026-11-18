export type SortDirection="desc"|"asc";
export type CycleSortKey="cycle"|"status"|"period"|string;
export type SortState=Readonly<{key:CycleSortKey;direction:SortDirection}>;
export type SortableIndicatorCycle=Readonly<{
 id:string;name:string;status:string;startAt?:string;endAt?:string;
 values:Record<string,string|null>;
}>;

const dateValue=(value:string|undefined):number|null=>{
 if(!value)return null;
 const date=Date.parse(value);
 return Number.isFinite(date)?date:null;
};
const numericValue=(value:string|null|undefined):number|null=>{
 if(value==null||value.trim()==="")return null;
 const number=Number(value);
 return Number.isFinite(number)?number:null;
};
const naturalCompare=(a:string,b:string)=>a.localeCompare(b,"fr",{numeric:true,sensitivity:"base"});
const compareNullable=(a:number|null,b:number|null,direction:SortDirection):number=>{
 if(a===null)return b===null?0:1;
 if(b===null)return -1;
 return direction==="desc"?b-a:a-b;
};
const compareText=(a:string,b:string,direction:SortDirection):number=>
 direction==="desc"?naturalCompare(b,a):naturalCompare(a,b);

export function nextIndicatorCycleSort(previous:SortState|null,key:CycleSortKey):SortState{
 return {key,direction:previous?.key===key&&previous.direction==="desc"?"asc":"desc"};
}
export function sortIndicatorCycles<T extends SortableIndicatorCycle>(
 cycles:readonly T[],sort:SortState|null
):T[]{
 const result=[...cycles];
 return result.sort((a,b)=>{
  if(sort===null){
   // Only the active cycle is pinned in the default view.
   const active=Number(b.status==="active")-Number(a.status==="active");
   if(active)return active;
   return compareNullable(dateValue(a.startAt),dateValue(b.startAt),"desc")||
    compareText(a.id,b.id,"desc");
  }
  let order=0;
  switch(sort.key){
   case "cycle":order=compareText(a.name,b.name,sort.direction);break;
   case "status":order=compareText(a.status,b.status,sort.direction);break;
   case "period":
    order=compareNullable(dateValue(a.startAt),dateValue(b.startAt),sort.direction)||
     compareNullable(dateValue(a.endAt),dateValue(b.endAt),sort.direction);
    break;
   default:
    order=compareNullable(numericValue(a.values[sort.key]),numericValue(b.values[sort.key]),sort.direction);
  }
  return order||compareNullable(dateValue(a.startAt),dateValue(b.startAt),"desc")||
   compareText(a.id,b.id,"desc");
 });
}
