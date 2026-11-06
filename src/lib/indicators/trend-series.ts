/** Shared presentation rules for the multi-indicator trends chart (SMN-396). */
export const MAX_TREND_SERIES=6;
export const TREND_COLORS=["#1b508d","#b45638","#159895","#7955a7","#bc8c21","#426da4"] as const;
export type TrendColumn={id:string;tag:string;name:string;unit:string};
export type TrendCycle={id:string;name:string;status:string;values:Record<string,string|null>};
export function trendNumbers(cycles:readonly TrendCycle[],indicatorId:string):(number|null)[]{
 return cycles.map(c=>{
  const raw=c.values[indicatorId];
  return raw===null||raw===undefined||raw.trim()===""||!Number.isFinite(Number(raw))?null:Number(raw);
 });
}
export function validateTrendSelection(ids:readonly string[],columns:readonly TrendColumn[]):"empty"|"limit"|"unknown"|"mixed-unit"|null{
 if(ids.length===0)return "empty";
 if(ids.length>MAX_TREND_SERIES)return "limit";
 if(new Set(ids).size!==ids.length||ids.some(id=>!columns.some(c=>c.id===id)))return "unknown";
 const units=new Set(ids.map(id=>columns.find(c=>c.id===id)!.unit.trim().toLocaleLowerCase()));
 return units.size>1?"mixed-unit":null;
}
export function trendRange(series:readonly (readonly (number|null)[])[]):{min:number;max:number;span:number}{
 const nums=series.flat().filter((n):n is number=>n!==null&&Number.isFinite(n));
 const min=Math.min(0,...nums),max=Math.max(1,...nums);
 return {min,max,span:Math.max(.000001,max-min)};
}
/** Break the line at missing values; neither null nor undefined means zero. */
export function trendSegments(values:readonly (number|null)[]):number[][]{
 const segments:number[][]=[];let active:number[]=[];
 values.forEach((value,i)=>{if(value===null){if(active.length)segments.push(active);active=[];}else active.push(i);});
 if(active.length)segments.push(active);
 return segments;
}
