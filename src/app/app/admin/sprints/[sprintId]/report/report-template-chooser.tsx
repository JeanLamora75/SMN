"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {reportMetricKeys,reportQualitativeKinds} from "@/lib/report-content-options";
type Template={id:string;name:string;protected:boolean;revision:number;historyDepth:number;
 sections:Array<{key:string;visible:boolean}>;content:{metrics:string[];qualitativeKinds:string[];includeHumanAnalysis:boolean}};
export default function ReportTemplateChooser({sprintId}:{sprintId:string}){
 const t=useTranslation(),tr=(key:string)=>t(("reportTemplates."+key) as Parameters<typeof t>[0]);
 const [items,setItems]=useState<Template[]>([]),[source,setSource]=useState("standard"),[name,setName]=useState("");
 const [selected,setSelected]=useState(""),[draft,setDraft]=useState<Template|null>(null),[base,setBase]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const dirty=!!draft&&JSON.stringify(draft)!==base;
 useUnsavedChanges(dirty||busy,tr("leaveWarning"));
 const load=async()=>{const r=await fetch("/api/admin/reports/templates",{cache:"no-store"});if(!r.ok)throw Error();
 const data=await r.json() as {templates:Template[]};setItems(data.templates);return data.templates;};
 useEffect(()=>{void load().catch(()=>setError(tr("error")));},[]);
 const choose=(id:string)=>{if(dirty&&!window.confirm(tr("leaveWarning")))return;
 const v=items.find(x=>x.id===id);setSelected(id);setDraft(v?structuredClone(v):null);
 setBase(v?JSON.stringify(v):"");setError("");setNotice("");};
 const submit=async(payload:unknown)=>{setBusy(true);setError("");setNotice("");
 try{const r=await fetch("/api/admin/reports/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 if(!r.ok)throw Error((await r.json() as {error?:string}).error??"failed");
 const response=await r.json() as {id:string};const refreshed=await load();
 if(payload&&typeof payload==="object"&&"action" in payload&&payload.action==="update"){
 const current=refreshed.find(x=>x.id===selected);setDraft(current?structuredClone(current):null);setBase(current?JSON.stringify(current):"");
 }else{setSource(response.id);setName("");}setNotice(tr("saved"));
 }catch(e){setError(e instanceof Error&&e.message==="conflict"?tr("conflict"):tr("error"));}
 finally{setBusy(false);}};
 const apply=async()=>{if(busy)return;
 if(dirty&&!window.confirm(tr("leaveWarning")))return;
 if(!window.confirm(tr("applyConfirm")))return;
 setBusy(true);setError("");setNotice("");
 try{const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/apply-template",{
 method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({templateId:source})});
 if(!r.ok){const data=await r.json() as {error?:string};
 throw Error(data.error==="template-unavailable"?"template-unavailable":"failed");}
 window.location.reload();
 }catch(e){setError(e instanceof Error&&e.message==="template-unavailable"?tr("unavailable"):tr("error"));}
 finally{setBusy(false);}
 };
 const edit=(update:(old:Template)=>Template)=>setDraft(v=>v?update(v):v);
 return <section className="border-top pt-3 d-grid gap-3"><h2 className="h5">{tr("heading")}</h2>
 <p className="text-secondary">{tr("intro")}</p>
 <div className="d-flex flex-wrap gap-2"><select className="form-select w-auto" value={source} onChange={e=>setSource(e.target.value)}>
 {items.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
 <input className="form-control w-auto" aria-label={tr("copyName")} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder={tr("copyName")}/>
 <button type="button" className="btn btn-outline-primary" disabled={busy||!name.trim()} onClick={()=>void submit({action:"copy",id:source,name})}>{tr("copy")}</button><button type="button" className="btn btn-primary" disabled={busy||items.length===0} onClick={()=>void apply()}>{tr("apply")}</button></div>
 <label>{tr("edit")} <select className="form-select" value={selected} onChange={e=>choose(e.target.value)}>
 <option value="">—</option>{items.filter(x=>!x.protected).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
 {draft&&!draft.protected&&<div className="border rounded p-3 d-grid gap-3">
 <label>{tr("copyName")}<input className="form-control" value={draft.name} maxLength={120} onChange={e=>edit(x=>({...x,name:e.target.value}))}/></label>
 <label>{tr("depth")}<select className="form-select" value={draft.historyDepth} onChange={e=>edit(x=>({...x,historyDepth:Number(e.target.value)}))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
 <fieldset><legend className="h6">{tr("sections")}</legend>{draft.sections.map((v,i)=><div key={v.key} className="d-flex align-items-center gap-2 my-1">
 <input type="checkbox" checked={v.visible} aria-label={v.key} onChange={e=>edit(x=>({...x,sections:x.sections.map(y=>y.key===v.key?{...y,visible:e.target.checked}:y)}))}/>
 <span className="flex-grow-1">{t(("standardReport."+v.key) as "standardReport.executive")}</span>
 <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===0} onClick={()=>edit(x=>{const sections=[...x.sections];[sections[i-1],sections[i]]=[sections[i],sections[i-1]];return {...x,sections};})}>↑</button>
 <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===draft.sections.length-1} onClick={()=>edit(x=>{const sections=[...x.sections];[sections[i+1],sections[i]]=[sections[i],sections[i+1]];return {...x,sections};})}>↓</button></div>)}</fieldset>
 <fieldset><legend className="h6">{tr("metrics")}</legend>{reportMetricKeys.map(k=><label className="form-check" key={k}><input className="form-check-input" type="checkbox" checked={draft.content.metrics.includes(k)} onChange={e=>edit(x=>({...x,content:{...x.content,metrics:e.target.checked?[...x.content.metrics,k]:x.content.metrics.filter(a=>a!==k)}}))}/> {t(("reportContent."+k) as "reportContent.committedSp")}</label>)}</fieldset>
 <fieldset><legend className="h6">{tr("qualitative")}</legend>{reportQualitativeKinds.map(k=><label className="form-check" key={k}><input className="form-check-input" type="checkbox" checked={draft.content.qualitativeKinds.includes(k)} onChange={e=>edit(x=>({...x,content:{...x.content,qualitativeKinds:e.target.checked?[...x.content.qualitativeKinds,k]:x.content.qualitativeKinds.filter(a=>a!==k)}}))}/> {t(("reportContent."+k) as "reportContent.risk")}</label>)}</fieldset>
 <label className="form-check"><input type="checkbox" className="form-check-input" checked={draft.content.includeHumanAnalysis} onChange={e=>edit(x=>({...x,content:{...x.content,includeHumanAnalysis:e.target.checked}}))}/> {t("reportContent.humanAnalysis")}</label>
 <button type="button" className="btn btn-primary" disabled={busy||!dirty} onClick={()=>void submit({action:"update",id:draft.id,template:draft})}>{tr("save")}</button>
 <p className="small text-secondary">{tr("deleteInfo")}</p></div>}
 {notice&&<p role="status" className="text-success">{notice}</p>}
 {error&&<p role="alert" className="text-danger">{error}</p>}
 </section>;
}
