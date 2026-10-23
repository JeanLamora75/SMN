"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {standardReportSections,type ReportSection} from "@/server/reports/standard-composition";
import {defaultSectionOptions,orderReportSections,type SectionOption} from "@/lib/report-section-options";
export default function ReportSectionEditor({sprintId,sections}:{sprintId:string;sections:ReportSection[]}){
 const t=useTranslation();const tr=(key:string)=>t(("reportSectionOptions."+key) as Parameters<typeof t>[0]);
 const [options,setOptions]=useState<SectionOption[]>(defaultSectionOptions),[baseline,setBaseline]=useState(""),[revision,setRevision]=useState<number|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(false),[saved,setSaved]=useState(false);
 const dirty=revision!==null&&JSON.stringify(options)!==baseline;
 useUnsavedChanges(dirty||busy,tr("leaveWarning"));
 useEffect(()=>{const ctrl=new AbortController();
 void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/sections",{cache:"no-store",signal:ctrl.signal})
 .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{options:SectionOption[];revision:number}>;})
 .then(v=>{if(!ctrl.signal.aborted){setOptions(v.options);setBaseline(JSON.stringify(v.options));setRevision(v.revision);}})
 .catch(()=>{if(!ctrl.signal.aborted)setError(true);});return()=>ctrl.abort();
 },[sprintId]);
 const move=(index:number,step:number)=>setOptions(current=>{const copy=[...current],other=index+step;
 if(other<0||other>=copy.length)return current;[copy[index],copy[other]]=[copy[other],copy[index]];return copy;});
 const save=async()=>{if(revision===null||busy)return;setBusy(true);setError(false);
 try{const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/sections",{
 method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({options,revision})});
 if(!r.ok)throw Error();const data=await r.json() as {revision:number};
 setRevision(data.revision);setBaseline(JSON.stringify(options));setSaved(true);
 }catch{setError(true);}finally{setBusy(false);}};
 return <section className="border-top pt-3">
 <h2 className="h5">{tr("heading")}</h2><p className="text-body-secondary">{tr("intro")}</p>
 <ol className="list-group list-group-numbered mb-3">{options.map((option,index)=><li key={option.key} className="list-group-item d-flex flex-wrap gap-2 align-items-center">
 <label className="form-check flex-grow-1"><input type="checkbox" className="form-check-input" checked={option.visible}
 disabled={busy||revision===null} onChange={e=>setOptions(current=>current.map(x=>x.key===option.key?{...x,visible:e.target.checked}:x))}/>
 <span className="form-check-label ms-2">{t(("standardReport."+option.key) as "standardReport.executive")}</span></label>
 <button className="btn btn-outline-secondary btn-sm" type="button" disabled={busy||index===0} onClick={()=>move(index,-1)} aria-label={tr("up")}>↑</button>
 <button className="btn btn-outline-secondary btn-sm" type="button" disabled={busy||index===options.length-1} onClick={()=>move(index,1)} aria-label={tr("down")}>↓</button>
 </li>)}</ol>
 <button className="btn btn-primary mb-3" type="button" disabled={!dirty||busy} onClick={()=>void save()}>{tr("save")}</button>
 {saved&&<p role="status" className="text-success">{tr("saved")}</p>}
 {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 <h3 className="h5 mt-3">{tr("preview")}</h3>
 {orderReportSections(sections,options).map(section=><section className="border-top pt-3" key={section.key}>
 <h4 className="h6">{t(("standardReport."+section.key) as "standardReport.executive")}</h4>
 {section.items.length?<ul className="list-group">{section.items.map((entry,index)=><li className="list-group-item" key={index}>
 {entry.href?<Link href={entry.href}>{entry.label}</Link>:<strong>{entry.label}</strong>}
 {entry.detail&&<span className="text-secondary ms-2">{entry.detail}</span>}</li>)}</ul>:
 <p className="text-body-secondary">{t(section.state==="unavailable"?"standardReport.unavailable":"standardReport.empty")}</p>}
 </section>)}
 </section>;
}
