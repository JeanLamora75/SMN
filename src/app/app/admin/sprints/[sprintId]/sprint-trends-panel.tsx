import Link from "next/link";
import type {TranslationKey} from "@/i18n/catalog";
import {sprintDetailPath} from "@/lib/sprint-detail-path";
import {trendGeometry} from "@/lib/sprint-trend-geometry";
import type {SprintTrendPoint} from "@/server/sprints/trends";

type Text=(key:TranslationKey,params?:Readonly<Record<string,string|number>>)=>string;
type Metric="completedSp"|"completionRate"|"actualCapacityJh";
const metrics=[
 {key:"completedSp",title:"sprintTrends.completedSp",unit:"SP",color:"var(--bs-primary)"},
 {key:"completionRate",title:"sprintTrends.completionRate",unit:"%",color:"var(--bs-success)"},
 {key:"actualCapacityJh",title:"sprintTrends.actualCapacityJh",unit:"J/H",color:"var(--bs-info)"}
] as const satisfies ReadonlyArray<{
 key:Metric;title:TranslationKey;unit:string;color:string
}>;

function TrendFigure({points,metric,title,unit,color,locale,t}:{
 points:readonly SprintTrendPoint[];metric:Metric;title:string;unit:string;
 color:string;locale:"fr"|"en";t:Text;
}){
 const values=points.map(point=>point[metric]);
 const geometry=trendGeometry(values);
 const hasValue=geometry.dots.length>0;
 const number=new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{
  maximumFractionDigits:2
 });
 const short=(v:number)=>number.format(v);
 return <figure className="border rounded-3 p-3 h-100 mb-0">
  <figcaption className="h6 mb-3">{title} <small className="text-secondary">({unit})</small></figcaption>
  {!hasValue?<p className="small text-secondary mb-0">
   {t("sprintDetail.trendNoMetric")}
  </p>:<>
   <svg viewBox="0 0 640 220" className="w-100 d-block" role="img"
    aria-label={t("sprintDetail.trendChartDescription",{metric:title,count:points.length})}
    style={{height:"auto",maxHeight:260}}>
    <title>{title}</title>
    <desc>{t("sprintDetail.trendChartAccessible")}</desc>
    {[0,0.5,1].map(ratio=>{
     const y=geometry.baseline-(geometry.baseline-geometry.top)*ratio;
     const tick=geometry.maxY*ratio;
     return <g key={ratio}>
      <line x1={geometry.left} x2={geometry.right} y1={y} y2={y}
       stroke="var(--bs-secondary-color)" strokeOpacity={0.35} strokeDasharray="4 4"/>
      <text x={geometry.left-7} y={y+4} textAnchor="end" fontSize={12}
       fill="var(--bs-body-color)">{short(tick)}</text>
     </g>;
    })}
    {points.map((p,index)=>{
     const x=geometry.left+(geometry.right-geometry.left)*
      (points.length>1?index/(points.length-1):0.5);
     return <text key={p.sprintId} x={x} y={geometry.baseline+20}
      fontSize={12} textAnchor="middle" fill="var(--bs-body-color)">
      {index+1}
     </text>;
    })}
    {geometry.segments.map((segment,index)=><line key={index}
     x1={segment.from.x} y1={segment.from.y}
     x2={segment.to.x} y2={segment.to.y}
     stroke={color} strokeWidth={3} strokeLinecap="round"/>)}
    {geometry.dots.map(dot=><g key={points[dot.index].sprintId}>
     <circle cx={dot.x} cy={dot.y} r={5} fill={color}
      stroke="var(--bs-body-bg)" strokeWidth={1.5}/>
     <title>{points[dot.index].name}: {short(dot.value)} {unit}</title>
    </g>)}
   </svg>
   <p className="small text-secondary mt-2 mb-0">{t("sprintDetail.trendAxisNote")}</p>
  </>}
 </figure>;
}

/** Three immutable closure-based charts, plus the same facts in an accessible table. */
export default function SprintTrendsPanel({data,locale,t}:{
 data:readonly SprintTrendPoint[]|null;locale:"fr"|"en";t:Text;
}){
 const number=new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{
  maximumFractionDigits:2
 });
 const display=(v:number|null,unit:string)=>
  v===null?t("sprintTrends.missing"):number.format(v)+" "+unit;
 return <section aria-label={t("sprintDetail.tabs.trends")}>
  <h2 className="h5 mb-2">{t("sprintDetail.tabs.trends")}</h2>
  <p className="small text-secondary mb-4">{t("sprintTrends.info")}</p>
  {data===null?<div className="alert alert-warning" role="status">
   {t("sprintTrends.error")}
  </div>:data.length===0?<div className="alert alert-secondary" role="status">
   {t("sprintTrends.empty")}
  </div>:<>
   <p className="small text-secondary">
    {t("sprintDetail.trendCount",{count:data.length})}
   </p>
   <div className="row g-3 mb-4">
    {metrics.map(metric=><div key={metric.key} className="col-12 col-xl-4">
     <TrendFigure points={data} metric={metric.key} title={t(metric.title)}
      unit={metric.unit} color={metric.color} locale={locale} t={t}/>
    </div>)}
   </div>
   <div className="table-responsive">
    <table className="table table-striped align-middle">
     <caption className="caption-top">{t("sprintDetail.trendTable")}</caption>
     <thead><tr>
      <th scope="col">{t("sprintDetail.trendCycle")}</th>
      <th scope="col">{t("sprintTrends.completedSp")}</th>
      <th scope="col">{t("sprintTrends.completionRate")}</th>
      <th scope="col">{t("sprintTrends.actualCapacityJh")}</th>
     </tr></thead>
     <tbody>{data.map((p,index)=><tr key={p.sprintId}>
      <th scope="row">
       <span className="text-secondary me-2">{index+1}.</span>
       <Link href={sprintDetailPath(p.sprintId)+"?tab=trends"}>{p.name}</Link>
       <span className="d-block small text-secondary">
        {t("sprintDetail.trendSnapshot",{version:p.snapshotVersion??"?"})}
       </span>
      </th>
      <td>{display(p.completedSp,"SP")}{p.completedSp!==null&&p.completedSpQuality!=="unqualified"&&<span className="d-block small text-secondary">{p.completedSpQuality==="estimated"?(locale==="fr"?"Estimée":"Estimated"):(locale==="fr"?"Connue":"Known")}</span>}{p.completedSp!==null&&p.completedSpQuality==="unqualified"&&<span className="d-block small text-secondary">{locale==="fr"?"Qualité non attestée":"Quality unverified"}</span>}</td>
      <td>{display(p.completionRate,"%")}</td>
      <td>{display(p.actualCapacityJh,"J/H")}</td>
     </tr>)}</tbody>
    </table>
   </div>
   <p className="small text-secondary">{t("sprintDetail.trendMissingNotice")}</p>
  </>}
 </section>;
}
