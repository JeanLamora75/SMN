export type ReportMetric={value:number|null;unit:string;sourceId?:string|null};
export type MetricPresentation="chart"|"table"|"both";
export const reportMetricLabels:Record<string,string>={committedSp:"SP initialement engagés",completedSp:"SP terminés",plannedJh:"Capacité prévue disponible",actualJh:"Capacité réelle disponible"};
export function metricDescriptor(key:string,metrics:Record<string,ReportMetric>){
 const m=metrics[key];if(!m||m.value===null||!Number.isFinite(m.value))return {label:reportMetricLabels[key]??key,value:null,unit:m?.unit??"",source:m?.sourceId??null};
 return {label:reportMetricLabels[key]??key,value:m.value,unit:m.unit,source:m.sourceId??null};
}
export function metricScale(value:number|null,max:number){return value===null||!Number.isFinite(value)||max<=0?null:Math.max(0,Math.min(100,value/max*100));}
export function limitedHistory<T>(rows:readonly T[],limit=5){return rows.slice(0,Math.min(5,Math.max(1,Math.trunc(limit))));}
