import {DecimalEngine,type Result} from "./index";

export type HistoricalPoint=Readonly<{cycleId:string;label:string;value:string|null;durationDays?:number|null}>;
export type HistoricalSeries=Readonly<{kind:"series";points:readonly HistoricalPoint[];requested:number;available:number}>;
export type HistoricalFunction="AVG_WEEK_LAST"|"SUM_LAST"|"LAST_VALUES"|"AVG_LAST"|"MIN_LAST"|"MAX_LAST"|"PREVIOUS"|"DELTA"|"DELTA_PCT";
export type HistoricalResult=Result|HistoricalSeries;

/** Input is ordered from oldest to newest and ends at the selected cycle. */
export function calculateHistorical(name:HistoricalFunction,history:readonly HistoricalPoint[],count:number):HistoricalResult{
 if(!Number.isSafeInteger(count)||count<1||count>1000)throw new RangeError("historical window");
 if(history.length>1000)throw new RangeError("historical history budget");
 const points=history.slice(-count);
 if(name==="LAST_VALUES")return {kind:"series",points,requested:count,available:points.length};
 const unavailable=(reason:"missing_source"|"division_by_zero"):Result=>({kind:"unavailable",reason});
 if(name==="PREVIOUS"||name==="DELTA"||name==="DELTA_PCT"){
  const previous=history.at(-1-count)?.value;
  const current=history.at(-1)?.value;
  if(previous===undefined||previous===null||name!=="PREVIOUS"&&(current===undefined||current===null))return unavailable("missing_source");
  const p=DecimalEngine.parse(previous);
  if(name==="PREVIOUS")return {kind:"available",value:DecimalEngine.format(p)};
  const difference=DecimalEngine.subtract(DecimalEngine.parse(current!),p);
  if(name==="DELTA")return {kind:"available",value:DecimalEngine.format(difference)};
  if(p===0n)return unavailable("division_by_zero");
  return {kind:"available",value:DecimalEngine.format(DecimalEngine.multiply(DecimalEngine.divide(difference,p),DecimalEngine.parse("100")))};
 }
 if(!points.length||points.some(p=>p.value===null))return unavailable("missing_source");
 if(name==="AVG_WEEK_LAST"){
  // Calendar-day weighting: total indicator values / (total calendar days / 7).
  // Missing/invalid durations remain unavailable; zero is a valid indicator value.
  if(points.some(p=>!Number.isSafeInteger(p.durationDays)||p.durationDays===null||p.durationDays===undefined||p.durationDays<=0))
   return {kind:"unavailable",reason:"invalid_domain",detail:"historical-cycle-duration"};
  const days=points.reduce((sum,p)=>sum+p.durationDays!,0);
  if(!Number.isSafeInteger(days)||days<=0) return {kind:"unavailable",reason:"invalid_domain",detail:"historical-cycle-duration"};
  const sum=points.reduce((total,p)=>DecimalEngine.add(total,DecimalEngine.parse(p.value!)),0n);
  return {kind:"available",value:DecimalEngine.format(
   DecimalEngine.divide(DecimalEngine.multiply(sum,DecimalEngine.parse("7")),DecimalEngine.parse(String(days)))
  )};
 }
 const values=points.map(p=>DecimalEngine.parse(p.value!));
 let answer:bigint;
 if(name==="SUM_LAST"||name==="AVG_LAST"){
  const total=values.reduce((s,v)=>DecimalEngine.add(s,v),0n);
  answer=name==="AVG_LAST"?DecimalEngine.divide(total,DecimalEngine.parse(String(values.length))):total;
 }else if(name==="MIN_LAST")answer=values.reduce((a,b)=>a<b?a:b);
 else answer=values.reduce((a,b)=>a>b?a:b);
 return {kind:"available",value:DecimalEngine.format(answer)};
}
