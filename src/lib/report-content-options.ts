export const reportMetricKeys=["committedSp","completedSp","plannedJh","actualJh","completionPercent"] as const;
export type ReportMetricKey=typeof reportMetricKeys[number];
export const reportQualitativeKinds=["risk","obstacle","dependency","decision","action","highlight"] as const;
export type ReportQualitativeKind=typeof reportQualitativeKinds[number];
export type ReportContentOptions={metrics:ReportMetricKey[];qualitativeKinds:ReportQualitativeKind[];includeHumanAnalysis:boolean};
export const defaultReportContentOptions=():ReportContentOptions=>({
 metrics:[...reportMetricKeys],qualitativeKinds:[...reportQualitativeKinds],includeHumanAnalysis:false
});
function keysAllowed<T extends string>(values:unknown,allowed:readonly T[]):values is T[]{
 return Array.isArray(values)&&values.every(v=>typeof v==="string"&&allowed.includes(v as T))&&
 new Set(values).size===values.length;
}
export function validReportContentOptions(value:unknown):value is ReportContentOptions{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return Object.keys(v).sort().join(",")==="includeHumanAnalysis,metrics,qualitativeKinds"&&
 keysAllowed(v.metrics,reportMetricKeys)&&keysAllowed(v.qualitativeKinds,reportQualitativeKinds)&&
 typeof v.includeHumanAnalysis==="boolean";
}
export type DisplayMetric={key:ReportMetricKey;value:number|null;unit:"SP"|"JH"|"%";available:boolean};
export function projectSelectedMetrics(values:{committed:number|null;completed:number|null;planned:number|null;actual:number|null},options:ReportContentOptions):DisplayMetric[]{
 const map:Record<ReportMetricKey,{value:number|null;unit:"SP"|"JH"|"%"}>={
 committedSp:{value:values.committed,unit:"SP"},completedSp:{value:values.completed,unit:"SP"},
 plannedJh:{value:values.planned,unit:"JH"},actualJh:{value:values.actual,unit:"JH"},
 completionPercent:{value:values.committed!==null&&values.committed>0&&values.completed!==null?Math.round(values.completed/values.committed*10000)/100:null,unit:"%"}
 };
 return options.metrics.map(key=>({key,...map[key],available:map[key].value!==null}));
}
export function eligibleReportFact(item:{type:string;hidden?:boolean;invalidated?:boolean;selected?:boolean},options:ReportContentOptions){
 return reportQualitativeKinds.some(k=>k===item.type)&&options.qualitativeKinds.includes(item.type as ReportQualitativeKind)&&
 item.hidden!==true&&item.invalidated!==true&&item.selected!==false;
}
