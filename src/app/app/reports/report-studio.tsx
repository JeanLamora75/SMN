"use client";
import {useEffect,useEffectEvent,useMemo,useRef,useState} from "react";
import "./studio-print.css";
import "./studio-responsive.css";
import {insertSelectedAnalysis,replaceEmbeddedAnalysis,type EmbeddedAnalysis} from "@/lib/report-embedded-analyses";
import ReportBlocksEditor from "./report-blocks-editor";
import {isReportBlock,moveItem,type ReportBlock} from "@/lib/report-studio-blocks";
import {useTranslation} from "@/i18n/client";
import {useReportEditing} from "./report-editing-context";
import {reportDocumentStyle} from "@/lib/report-document-style";
import type {ReportDocument} from "@/server/reports/report-documents";

type Section={key:string;visible:boolean};
type JournalChoice={id:string;type:"human"|"ai";scope:string;content:string;archiveId:string|null};
type StudioContent={pageBreaks?:Record<string,boolean>;documentStyle?:unknown;analyses?:EmbeddedAnalysis[];sections?:Section[];blocks?:unknown[];userNotes?:Record<string,string>;metrics?:Record<string,{value:number|null;unit:string}>;[key:string]:unknown};
type Mode="composition"|"writing"|"preview";

export default function ReportStudio({document,readOnly,journal,teamId}:{document:ReportDocument;readOnly:boolean;journal:JournalChoice[];teamId?:string}){
 const t=useTranslation(),tr=(k:string)=>t(("reportsStudio."+k) as Parameters<typeof t>[0]);
 const editing=useReportEditing();
 const initial=document.content as StudioContent;
 const [content,setContent]=useState<StudioContent>(initial);
 const sessionId=useRef(crypto.randomUUID()); const sequence=useRef(0); const changeVersion=useRef(0);
 const [mode,setMode]=useState<Mode>("composition");
 const sections=useMemo(()=>Array.isArray(content.sections)?content.sections:[],[content.sections]);
 const [selected,setSelected]=useState(sections[0]?.key??"");
 const [planOpen,setPlanOpen]=useState(true),[propertiesOpen,setPropertiesOpen]=useState(true);
 const [zoom,setZoom]=useState(100),[saving,setSaving]=useState(false);
 const [saved,setSaved]=useState(true),[error,setError]=useState("");
 const [undo,setUndo]=useState<StudioContent[]>([]),[redo,setRedo]=useState<StudioContent[]>([]);
 const change=(next:StudioContent)=>{setUndo(x=>[...x.slice(-49),content]);setRedo([]);changeVersion.current++;setContent(next);setSaved(false);editing.setDirty(true);setError("");};
 const back=()=>{if(!undo.length)return;setRedo(x=>[...x,content]);changeVersion.current++;setContent(undo[undo.length-1]);setUndo(x=>x.slice(0,-1));setSaved(false);editing.setDirty(true);};
 const forward=()=>{if(!redo.length)return;setUndo(x=>[...x,content]);changeVersion.current++;setContent(redo[redo.length-1]);setRedo(x=>x.slice(0,-1));setSaved(false);editing.setDirty(true);};
 const style=reportDocumentStyle(content.documentStyle);
 const updateStyle=(next:Partial<typeof style>)=>change({...content,documentStyle:{...style,...next}});
 const pageBreaks=content.pageBreaks??{};
 const notes=content.userNotes??{};
 const analyses=content.analyses??[];
 const [candidate,setCandidate]=useState("");
 const addAnalysis=()=>{
  if(readOnly)return;
  const found=journal.find(a=>a.type+":"+a.id===candidate);
  if(!found)return;
  const next:EmbeddedAnalysis={sourceId:found.id,archiveId:found.archiveId,origin:found.type,scope:found.scope,content:found.content,selectedAt:new Date().toISOString()};
  change({...content,analyses:insertSelectedAnalysis(analyses,next)});setCandidate("");
 };
 const blocks:ReportBlock[]=Array.isArray(content.blocks)?content.blocks.filter(isReportBlock):[];
 const moveSection=(index:number,direction:-1|1)=>change({...content,sections:moveItem(sections,index,direction)});
 const editNote=(key:string,value:string)=>change({...content,userNotes:{...notes,[key]:value}});
 const toggleSection=(key:string)=>change({...content,sections:sections.map(s=>s.key===key?{...s,visible:!s.visible}:s)});
 const save=async()=>{
  if(readOnly||saving||saved)return;
  const sendingVersion=changeVersion.current;setSaving(true);editing.setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(document.sprintId)+"/documents/"+encodeURIComponent(document.id)+(teamId?"?teamId="+encodeURIComponent(teamId):""),{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:sessionId.current,sequence:++sequence.current,...(teamId?{revision:editing.revision}:{}),content})});
   if(!response.ok)throw Error(response.status===409?"conflict":"failed");
   const data=await response.json() as {revision:number};
   if(data.revision){const stillDirty=changeVersion.current!==sendingVersion;setSaved(!stillDirty);editing.acknowledge(data.revision,stillDirty);}
  }catch(e){setError(e instanceof Error&&e.message==="conflict"?tr("conflict"):tr("saveError"));}
  finally{setSaving(false);editing.setBusy(false);}
 };
 // Keep the 650 ms debounce tied to document edits, not to the identity of save.
 // Effect Events always read the latest save closure without restarting the timer.
 const autoSave=useEffectEvent(()=>{void save();});
 useEffect(()=>{if(readOnly||saved||saving||error)return;const timer=setTimeout(()=>{
  autoSave();
 },650);return ()=>clearTimeout(timer);},[content,saved,saving,error,readOnly]);
 return <section className="smn-studio-shell d-grid gap-3">
  <header className="d-flex flex-wrap justify-content-between gap-2 align-items-center">
   <div><h1 className="h4 mb-1">{document.title}</h1><span className="small text-secondary">{document.templateId} · V{document.templateVersion} · {saved?tr("saved"):tr("unsaved")}</span></div>
   {!readOnly&&<button type="button" className="btn btn-primary" disabled={saved||saving} onClick={()=>void save()}>{saving?tr("saving"):tr("save")}</button>}
  </header>
  {!readOnly&&<div className="d-flex gap-2"><button type="button" disabled={!undo.length} onClick={back}>{tr("undo")}</button><button type="button" disabled={!redo.length} onClick={forward}>{tr("redo")}</button></div>}
  <nav className="nav nav-pills gap-2 smn-studio-controls" aria-label={tr("modes")}>
   {(["composition","writing","preview"] as const).map(k=><button key={k} type="button" className={"nav-link"+(mode===k?" active":"")} aria-pressed={mode===k} onClick={()=>setMode(k)}>{tr(k)}</button>)}
  </nav>
  {error&&<p className="alert alert-danger" role="alert">{error}</p>}
  <div className="d-flex gap-2 flex-wrap">
   {mode!=="preview"&&<button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>setPlanOpen(v=>!v)} aria-expanded={planOpen}>{tr("plan")}</button>}
   {mode==="composition"&&<button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>setPropertiesOpen(v=>!v)} aria-expanded={propertiesOpen}>{tr("properties")}</button>}
   <label className="d-flex align-items-center gap-2">{tr("zoom")}<select className="form-select form-select-sm" value={zoom} onChange={e=>setZoom(Number(e.target.value))}>{[75,90,100,110,125].map(v=><option key={v} value={v}>{v}%</option>)}</select></label>
  </div>
  <p className="smn-studio-mobile-hint alert alert-info">{tr("mobileHint")}</p>
  {mode==="composition"&&<fieldset className="smn-studio-complex border rounded p-3"><legend className="h6">{tr("appearance")}</legend>
    <div className="row g-2">
     <label className="col-md-3">{tr("orientation")}<select className="form-select" disabled={readOnly} value={style.orientation} onChange={e=>updateStyle({orientation:e.target.value as "portrait"|"landscape"})}><option value="portrait">{tr("portrait")}</option><option value="landscape">{tr("landscape")}</option></select></label>
     <label className="col-md-3 form-check align-self-center"><input type="checkbox" className="form-check-input" disabled={readOnly} checked={style.cover} onChange={e=>updateStyle({cover:e.target.checked})}/>{tr("cover")}</label>
     <label className="col-md-3 form-check align-self-center"><input type="checkbox" className="form-check-input" disabled={readOnly} checked={style.toc} onChange={e=>updateStyle({toc:e.target.checked})}/>{tr("toc")}</label>
     <label className="col-md-6">{tr("coverTitle")}<input className="form-control" disabled={readOnly} maxLength={120} value={style.coverTitle} onChange={e=>updateStyle({coverTitle:e.target.value})}/></label>
     <label className="col-md-6">{tr("subtitle")}<input className="form-control" disabled={readOnly} maxLength={200} value={style.subtitle} onChange={e=>updateStyle({subtitle:e.target.value})}/></label>
     <label className="col-md-12">{tr("footerText")}<input className="form-control" disabled={readOnly} maxLength={200} value={style.footerText} onChange={e=>updateStyle({footerText:e.target.value})}/></label>
    </div>
   </fieldset>}
  <div className="smn-studio-layout d-flex flex-column flex-xl-row gap-3 align-items-start">
   {mode!=="preview"&&planOpen&&<aside className="smn-studio-side border rounded p-3 w-100 flex-shrink-0" style={{maxWidth:244}} aria-label={tr("plan")}>
    <h2 className="h6">{tr("plan")}</h2><div className="d-grid gap-1">
     {sections.map((s,i)=><div key={s.key} className="d-flex gap-1 align-items-center"><button type="button" className={"btn btn-sm text-start flex-grow-1 "+(selected===s.key?"btn-primary":"btn-outline-secondary")} onClick={()=>setSelected(s.key)}>{s.key}{!s.visible?" · "+tr("hidden"):""}</button>{!readOnly&&mode==="composition"&&<><button className="btn btn-sm btn-outline-secondary" type="button" disabled={i===0} aria-label={tr("up")} onClick={()=>moveSection(i,-1)}>↑</button><button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===sections.length-1} aria-label={tr("down")} onClick={()=>moveSection(i,1)}>↓</button></>}</div>)}
    </div>
   </aside>}
   <main className="smn-studio-canvas flex-grow-1 w-100 border rounded p-3" style={{minWidth:0,background:"var(--bs-secondary-bg)"}}>
    <article aria-label={tr("document")} className={"smn-studio-paper smn-report-paper mx-auto bg-white text-dark shadow-sm p-4 "+(style.orientation==="portrait"?"smn-report-print-portrait":"smn-report-print-landscape")} style={{maxWidth:Math.round((style.orientation==="portrait"?794:1123)*zoom/100),minHeight:Math.round((style.orientation==="portrait"?1123:794)*zoom/100),overflowWrap:"anywhere"}}>
     {style.cover&&<header className="border-bottom pb-4 mb-4"><h2 className="h3 text-dark">{style.coverTitle||document.title}</h2><p>{style.subtitle}</p></header>}
     <h2 className="h4 text-dark">{document.title}</h2>
     {style.toc&&<nav aria-label={tr("toc")}><h3 className="h6">{tr("toc")}</h3><ol>{sections.filter(s=>s.visible).map(s=><li key={s.key}>{s.key}</li>)}</ol><p className="small">{tr("tocPending")}</p></nav>}
     {sections.filter(s=>s.visible).map(s=><section key={s.key} className={"my-4 "+(pageBreaks[s.key]?"smn-section-page-break":"")} id={"section-"+s.key}>
      <h3 className="h5 border-bottom pb-2">{s.key}</h3>
      {s.key==="indicators"&&Object.entries(content.metrics??{}).map(([key,v])=><p key={key}><strong>{key} :</strong> {v?.value===null||v?.value===undefined?tr("unknown"):v.value+" "+v.unit}</p>)}
      {mode==="writing"&&!readOnly?<label className="d-block">{tr("comment")}
       <textarea className="form-control" rows={5} maxLength={12000} value={notes[s.key]??""} onChange={e=>editNote(s.key,e.target.value)}/></label>:
       <p className="text-dark" style={{whiteSpace:"pre-wrap"}}>{notes[s.key]||tr("noComment")}</p>}
     </section>)}
     {style.footerText&&<footer className="border-top pt-2 small">{style.footerText}</footer>}
    </article>
    <div className="smn-studio-complex"><ReportBlocksEditor sections={sections} blocks={blocks} metrics={content.metrics??{}} selectedSection={selected} readOnly={readOnly} mode={mode} onChange={next=>change({...content,blocks:next})}/></div>
   </main>
   {mode==="composition"&&propertiesOpen&&<aside className="border rounded p-3 w-100 flex-shrink-0" style={{maxWidth:276}} aria-label={tr("properties")}>
    <h2 className="h6">{tr("properties")}</h2>
    {sections.filter(s=>s.key===selected).map(s=><div key={s.key}><p>{s.key}</p>
     <label className="form-check"><input className="form-check-input" type="checkbox" disabled={readOnly} checked={s.visible} onChange={()=>toggleSection(s.key)}/>{tr("visible")}</label><label className="form-check mt-2"><input className="form-check-input" type="checkbox" disabled={readOnly} checked={!!pageBreaks[s.key]} onChange={e=>change({...content,pageBreaks:{...pageBreaks,[s.key]:e.target.checked}})}/>{tr("pageBreak")}</label>
    </div>)}
   </aside>}
  </div>
  <section className="border rounded p-3 d-grid gap-2">
   <h2 className="h6">{tr("analyses")}</h2>
   {!readOnly&&mode!=="preview"&&<div className="d-flex flex-wrap gap-2">
    <select className="form-select flex-grow-1" aria-label={tr("selectAnalysis")} value={candidate} onChange={e=>setCandidate(e.target.value)}>
     <option value="">{tr("selectAnalysis")}</option>{journal.map(a=><option key={a.type+":"+a.id} value={a.type+":"+a.id}>{a.type==="ai"?tr("aiOrigin"):tr("humanOrigin")} · {a.scope}</option>)}
    </select><button className="btn btn-outline-primary" type="button" disabled={!candidate} onClick={addAnalysis}>{tr("insertAnalysis")}</button>
   </div>}
   {analyses.length===0&&<p className="text-secondary">{tr("noAnalysis")}</p>}
   {analyses.map(a=><article key={a.origin+":"+a.sourceId} className="border rounded p-2">
    <p className="small text-secondary">{a.origin==="ai"?tr("aiOrigin"):tr("humanOrigin")} · {a.scope} · {tr("copiedSnapshot")}</p>
    {readOnly||mode==="preview"?<p style={{whiteSpace:"pre-wrap"}}>{a.content}</p>:<textarea className="form-control" maxLength={12000} rows={4} value={a.content} onChange={e=>change({...content,analyses:replaceEmbeddedAnalysis(analyses,a.sourceId,a.origin,e.target.value)})}/>}
   </article>)}
  </section>
  {!saved&&!readOnly&&<p className="text-warning" role="status">{tr("unsavedWarning")}</p>}
 </section>;
}
