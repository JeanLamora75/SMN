"use client";
import {metricDescriptor,type MetricPresentation,type ReportMetric} from "@/lib/report-metric-view";
import {useTranslation} from "@/i18n/client";
export default function ReportMetricDisplay({metricKey,metrics,presentation}:{metricKey:string|null;metrics:Record<string,ReportMetric>;presentation:MetricPresentation}){
 const t=useTranslation(),tr=(k:string)=>t(("reportsBlocks."+k) as Parameters<typeof t>[0]);
 if(!metricKey)return <p>{tr("unbound")}</p>;
 const metric=metricDescriptor(metricKey,metrics),value=metric.value,readable=value===null?tr("unknown"):`${value} ${metric.unit}`;
 return <div>
  {(presentation==="chart"||presentation==="both")&&<div role="img" aria-label={`${metric.label}: ${readable}`} className="mb-2">
   <div className="d-flex justify-content-between"><span>{metric.label}</span><strong>{readable}</strong></div>
   <p className="small text-secondary mb-0">{tr("noChartScale")}</p>
  </div>}
  {(presentation==="table"||presentation==="both")&&<table className="table table-sm"><caption>{tr("metricTable")}</caption><thead><tr><th scope="col">{tr("metric")}</th><th scope="col">{tr("value")}</th><th scope="col">{tr("source")}</th></tr></thead><tbody><tr><th scope="row">{metric.label}</th><td>{readable}</td><td>{metric.source??tr("sourceUnknown")}</td></tr></tbody></table>}
  {presentation==="chart"&&<p className="visually-hidden">{metric.label}: {readable}. {tr("source")}: {metric.source??tr("sourceUnknown")}</p>}
 </div>;
}
