"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {defaultReportContentOptions,projectSelectedMetrics,reportMetricKeys,reportQualitativeKinds,eligibleReportFact,type ReportContentOptions} from "@/lib/report-content-options";
type Fact={id:string;type:string;title:string;status:string;hidden?:boolean;invalidated?:boolean;selected?:boolean};
type Values={committed:number|null;completed:number|null;planned:number|null;actual:number|null};
export default function ReportContentEditor({sprintId,values,facts}:{sprintId:string;values:Values;facts:Fact[]}){
 const t=useTranslation(),tr=(key:string)=>t(("reportContent."+key) as Parameters<typeof t>[0]);
 const [options,setOptions]=useState<ReportContentOptions>(defaultReportContentOptions);
 const [baseline,setBaseline]=useState(""),[revision,setRevision]=useState<number|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(false),[saved,setSaved]=useState(false);
 const dirty=revision!==null&&JSON.stringify(options)!==baseline;
 useUnsavedChanges(dirty||busy,tr("leaveWarning"));
 useEffect(()=>{const ctrl=new AbortController();
 void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/content",{signal:ctrl.signal,cache:"no-store"})
 .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{options:ReportContentOptions;revision:number}>;})
 .then(v=>{if(!ctrl.signal.aborted){setOptions(v.options);setBaseline(JSON.stringify(v.options));setRevision(v.revision);}})
 .catch(()=>{if(!ctrl.signal.aborted)setError(true);});return()=>ctrl.abort();},[sprintId]);
 const toggleMetric=(key:typeof reportMetricKeys[number],checked:boolean)=>setOptions(o=>({...o,metrics:checked?[...o.metrics,key]:o.metrics.filter(k=>k!==key)}));
 const toggleKind=(key:typeof reportQualitativeKinds[number],checked:boolean)=>setOptions(o=>({...o,qualitativeKinds:checked?[...o.qualitativeKinds,key]:o.qualitativeKinds.filter(k=>k!==key)}));
 const save=async()=>{if(revision===null||busy)return;setBusy(true);setError(false);
 try{const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/content",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision,options})});
 if(!r.ok)throw Error();const v=await r.json() as {revision:number};
 setRevision(v.revision);setBaseline(JSON.stringify(options));setSaved(true);
 }catch{setError(true);}finally{setBusy(false);}};
 const metrics=projectSelectedMetrics(values,options);
 const eligible=facts.filter(f=>eligibleReportFact(f,options));
 return <section className="border-top pt-3 d-grid gap-3">
  <h2 className="h5">{tr("heading")}</h2><p className="text-body-secondary">{tr("intro")}</p>
  <fieldset><legend className="h6">{tr("metrics")}</legend>
   <div className="d-flex flex-wrap gap-3">{reportMetricKeys.map(key=><label key={key} className="form-check">
    <input type="checkbox" className="form-check-input" checked={options.metrics.includes(key)} disabled={revision===null||busy}
     onChange={e=>toggleMetric(key,e.target.checked)}/>
    <span className="form-check-label ms-1">{tr(key)}</span></label>)}</div>
  </fieldset>
  <fieldset><legend className="h6">{tr("qualitative")}</legend>
   <div className="d-flex flex-wrap gap-3">{reportQualitativeKinds.map(key=><label className="form-check" key={key}>
    <input type="checkbox" className="form-check-input" checked={options.qualitativeKinds.includes(key)}
    disabled={revision===null||busy} onChange={e=>toggleKind(key,e.target.checked)}/>
    <span className="form-check-label ms-1">{tr(key)}</span></label>)}</div>
  </fieldset>
  <label className="form-check"><input type="checkbox" className="form-check-input" checked={options.includeHumanAnalysis}
   disabled={revision===null||busy} onChange={e=>setOptions(o=>({...o,includeHumanAnalysis:e.target.checked}))}/>
   <span className="form-check-label ms-1">{tr("humanAnalysis")}</span></label>
  <button type="button" className="btn btn-primary" disabled={!dirty||busy} onClick={()=>void save()}>{tr("save")}</button>
  {saved&&<p role="status" className="text-success">{tr("saved")}</p>}
  {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
  <h3 className="h6">{tr("preview")}</h3>
  <ul className="list-group">{metrics.map(m=><li key={m.key} className="list-group-item">{tr(m.key)}: {m.available?m.value+" "+m.unit:tr("unavailable")}</li>)}</ul>
  {eligible.length?<ul>{eligible.map(f=><li key={f.id}>{f.title} — {f.status}</li>)}</ul>:<p className="text-secondary">{tr("noQualitative")}</p>}
  {options.includeHumanAnalysis&&<p className="text-secondary">{tr("analysisUnavailable")}</p>}
 </section>;
}
