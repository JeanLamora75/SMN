export type KanbanTrendPeriod={
 id:string;name:string;startOn:string;endOn:string;
 started:number|null;throughput:number|null;wipFinal:number|null;
 cycleDays:number|null;leadDays:number|null;
};
const date=/^\d{4}-\d{2}-\d{2}$/;
export function parseKanbanTrendPayload(input:unknown):KanbanTrendPeriod[]|null{
 if(!input||typeof input!=="object"||Array.isArray(input))return null;
 const raw=(input as {periods?:unknown}).periods;
 if(!Array.isArray(raw)||raw.length>5)return null;
 const result:KanbanTrendPeriod[]=[];
 const ids=new Set<string>();
 for(const item of raw){
  if(!item||typeof item!=="object"||Array.isArray(item))return null;
  const p=item as Record<string,unknown>;
  if(typeof p.id!=="string"||!p.id||ids.has(p.id)||
   typeof p.name!=="string"||!p.name.trim()||
   typeof p.startOn!=="string"||!date.test(p.startOn)||
   typeof p.endOn!=="string"||!date.test(p.endOn))return null;
  for(const key of ["started","throughput","wipFinal"] as const){
   const value=p[key];
   if(value!==null&&(!Number.isSafeInteger(value)||Number(value)<0))return null;
  }
  for(const key of ["cycleDays","leadDays"] as const){
   const value=p[key];
   if(value!==null&&(typeof value!=="number"||!Number.isFinite(value)||value<0))return null;
  }
  ids.add(p.id);
  result.push(p as KanbanTrendPeriod);
 }
 for(let i=1;i<result.length;i++){
  const previous=result[i-1],current=result[i];
  if(previous.startOn>current.startOn||
   previous.startOn===current.startOn&&previous.id>=current.id)return null;
 }
 return result;
}
