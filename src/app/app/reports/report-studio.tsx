"use client";
import {useMemo,useState} from "react";
import ReportBlocksEditor from "./report-blocks-editor";
import {isReportBlock,moveItem,type ReportBlock} from "@/lib/report-studio-blocks";
import {useTranslation} from "@/i18n/client";
import type {ReportDocument} from "@/server/reports/report-documents";

type Section={key:string;visible:boolean};
type StudioContent={sections?:Section[];blocks?:unknown[];userNotes?:Record<string,string>;metrics?:Record<string,{value:number|null;unit:string}>;[key:string]:unknown};
type Mode="composition"|"writing"|"preview";

export default function ReportStudio({document,readOnly}:{document:ReportDocument;readOnly:boolean}){
 const t=useTranslation(),tr=(k:string)=>t(("reportsStudio."+k) as Parameters<typeof t>[0]);
 const initial=document.content as StudioContent;
 const [content,setContent]=useState<StudioContent>(initial);
 const [revision,setRevision]=useState(document.revision);
 const [mode,setMode]=useState<Mode>("composition");
 const sections=useMemo(()=>Array.isArray(content.sections)?content.sections:[],[content.sections]);
 const [selected,setSelected]=useState(sections[0]?.key??"");
 const [planOpen,setPlanOpen]=useState(true),[propertiesOpen,setPropertiesOpen]=useState(true);
 const [zoom,setZoom]=useState(100),[saving,setSaving]=useState(false);
 const [saved,setSaved]=useState(true),[error,setError]=useState("");
 const change=(next:StudioContent)=>{setContent(next);setSaved(false);setError("");};
 const notes=content.userNotes??{};
 const blocks:ReportBlock[]=Array.isArray(content.blocks)?content.blocks.filter(isReportBlock):[];
 const moveSection=(index:number,direction:-1|1)=>change({...content,sections:moveItem(sections,index,direction)});
 const editNote=(key:string,value:string)=>change({...content,userNotes:{...notes,[key]:value}});
 const toggleSection=(key:string)=>change({...content,sections:sections.map(s=>s.key===key?{...s,visible:!s.visible}:s)});
 const save=async()=>{
  if(readOnly||saving||saved)return;
  setSaving(true);setError("");
  try{
   const response=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(document.sprintId)+"/documents/"+encodeURIComponent(document.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision,content})});
   if(!response.ok)throw Error(response.status===409?"conflict":"failed");
   const data=await response.json() as {revision:number};
   setRevision(data.revision);setSaved(true);
  }catch(e){setError(e instanceof Error&&e.message==="conflict"?tr("conflict"):tr("saveError"));}
  finally{setSaving(false);}
 };
 return <section className="d-grid gap-3">
  <header className="d-flex flex-wrap justify-content-between gap-2 align-items-center">
   <div><h1 className="h4 mb-1">{document.title}</h1><span className="small text-secondary">{document.templateId} · V{document.templateVersion} · {saved?tr("saved"):tr("unsaved")}</span></div>
   {!readOnly&&<button type="button" className="btn btn-primary" disabled={saved||saving} onClick={()=>void save()}>{saving?tr("saving"):tr("save")}</button>}
  </header>
  <nav className="nav nav-pills gap-2" aria-label={tr("modes")}>
   {(["composition","writing","preview"] as const).map(k=><button key={k} type="button" className={"nav-link"+(mode===k?" active":"")} aria-pressed={mode===k} onClick={()=>setMode(k)}>{tr(k)}</button>)}
  </nav>
  {error&&<p className="alert alert-danger" role="alert">{error}</p>}
  <div className="d-flex gap-2 flex-wrap">
   {mode!=="preview"&&<button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>setPlanOpen(v=>!v)} aria-expanded={planOpen}>{tr("plan")}</button>}
   {mode==="composition"&&<button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>setPropertiesOpen(v=>!v)} aria-expanded={propertiesOpen}>{tr("properties")}</button>}
   <label className="d-flex align-items-center gap-2">{tr("zoom")}<select className="form-select form-select-sm" value={zoom} onChange={e=>setZoom(Number(e.target.value))}>{[75,90,100,110,125].map(v=><option key={v} value={v}>{v}%</option>)}</select></label>
  </div>
  <div className="d-flex flex-column flex-xl-row gap-3 align-items-start">
   {mode!=="preview"&&planOpen&&<aside className="border rounded p-3 w-100 flex-shrink-0" style={{maxWidth:244}} aria-label={tr("plan")}>
    <h2 className="h6">{tr("plan")}</h2><div className="d-grid gap-1">
     {sections.map((s,i)=><div key={s.key} className="d-flex gap-1 align-items-center"><button type="button" className={"btn btn-sm text-start flex-grow-1 "+(selected===s.key?"btn-primary":"btn-outline-secondary")} onClick={()=>setSelected(s.key)}>{s.key}{!s.visible?" · "+tr("hidden"):""}</button>{!readOnly&&mode==="composition"&&<><button className="btn btn-sm btn-outline-secondary" type="button" disabled={i===0} aria-label={tr("up")} onClick={()=>moveSection(i,-1)}>↑</button><button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===sections.length-1} aria-label={tr("down")} onClick={()=>moveSection(i,1)}>↓</button></>}</div>)}
    </div>
   </aside>}
   <main className="flex-grow-1 w-100 border rounded p-3" style={{minWidth:0,background:"var(--bs-secondary-bg)"}}>
    <article aria-label={tr("document")} className="mx-auto bg-white text-dark shadow-sm p-4" style={{maxWidth:Math.round(794*zoom/100),minHeight:Math.round(1123*zoom/100),overflowWrap:"anywhere"}}>
     <h2 className="h4 text-dark">{document.title}</h2>
     {sections.filter(s=>s.visible).map(s=><section key={s.key} className="my-4" id={"section-"+s.key}>
      <h3 className="h5 border-bottom pb-2">{s.key}</h3>
      {s.key==="indicators"&&Object.entries(content.metrics??{}).map(([key,v])=><p key={key}><strong>{key} :</strong> {v?.value===null||v?.value===undefined?tr("unknown"):v.value+" "+v.unit}</p>)}
      {mode==="writing"&&!readOnly?<label className="d-block">{tr("comment")}
       <textarea className="form-control" rows={5} maxLength={12000} value={notes[s.key]??""} onChange={e=>editNote(s.key,e.target.value)}/></label>:
       <p className="text-dark" style={{whiteSpace:"pre-wrap"}}>{notes[s.key]||tr("noComment")}</p>}
     </section>)}
    </article>
    <ReportBlocksEditor sections={sections} blocks={blocks} metrics={content.metrics??{}} selectedSection={selected} readOnly={readOnly} mode={mode} onChange={next=>change({...content,blocks:next})}/>
   </main>
   {mode==="composition"&&propertiesOpen&&<aside className="border rounded p-3 w-100 flex-shrink-0" style={{maxWidth:276}} aria-label={tr("properties")}>
    <h2 className="h6">{tr("properties")}</h2>
    {sections.filter(s=>s.key===selected).map(s=><div key={s.key}><p>{s.key}</p>
     <label className="form-check"><input className="form-check-input" type="checkbox" disabled={readOnly} checked={s.visible} onChange={()=>toggleSection(s.key)}/>{tr("visible")}</label>
    </div>)}
   </aside>}
  </div>
  {!saved&&!readOnly&&<p className="text-warning" role="status">{tr("unsavedWarning")}</p>}
 </section>;
}
