"use client";
import {useState} from "react";
import {moveItem,reportBlockKinds,visibleBlocks,type ReportBlock,type ReportBlockKind} from "@/lib/report-studio-blocks";
import {useTranslation} from "@/i18n/client";
type Metric={value:number|null;unit:string};
export default function ReportBlocksEditor({sections,blocks,metrics,selectedSection,readOnly,mode,onChange}:{sections:readonly {key:string;visible:boolean}[];blocks:ReportBlock[];metrics:Record<string,Metric>;selectedSection:string;readOnly:boolean;mode:"composition"|"writing"|"preview";onChange:(next:ReportBlock[])=>void}){
 const t=useTranslation(),tr=(k:string)=>t(("reportsBlocks."+k) as Parameters<typeof t>[0]);
 const [selectedId,setSelectedId]=useState<string|null>(null),[kind,setKind]=useState<ReportBlockKind>("text");
 const selected=blocks.find(b=>b.id===selectedId);
 const patch=(id:string,p:Partial<ReportBlock>)=>onChange(blocks.map(b=>b.id===id?{...b,...p}:b));
 const add=()=>{if(readOnly||!selectedSection)return;const b:ReportBlock={id:crypto.randomUUID(),sectionKey:selectedSection,kind,title:"",visible:true,width:"full",text:"",metricKey:null,imageUrl:null};onChange([...blocks,b]);setSelectedId(b.id);};
 const move=(id:string,d:-1|1)=>{const index=blocks.findIndex(b=>b.id===id);const target=index+d;if(index<0||target<0||target>=blocks.length||blocks[target].sectionKey!==blocks[index].sectionKey)return;onChange(moveItem(blocks,index,d));};
 return <div className="d-grid gap-3">
 {mode==="composition"&&!readOnly&&<div className="d-flex flex-wrap gap-2 align-items-center">
  <label>{tr("kind")}<select className="form-select form-select-sm" value={kind} onChange={e=>setKind(e.target.value as ReportBlockKind)}>{reportBlockKinds.map(k=><option key={k} value={k}>{tr(k)}</option>)}</select></label>
  <button className="btn btn-sm btn-outline-primary" type="button" onClick={add} disabled={!selectedSection}>{tr("add")}</button>
 </div>}
 {sections.filter(s=>s.visible).map(section=><section key={section.key} className="border rounded p-2">
  <h3 className="h6">{section.key}</h3>
  {visibleBlocks(blocks,section.key).map(b=><article key={b.id} className={"border rounded p-2 mb-2"+(selectedId===b.id?" border-primary":"")} style={{maxWidth:b.width==="half"?"50%":"100%"}}>
   <div className="d-flex justify-content-between gap-2 align-items-center">
    <button className="btn btn-sm btn-link text-start" type="button" onClick={()=>setSelectedId(b.id)}>{b.title||tr(b.kind)}</button>
    {mode==="composition"&&!readOnly&&<div className="d-flex gap-1">
     <button type="button" className="btn btn-sm btn-outline-secondary" aria-label={tr("up")} onClick={()=>move(b.id,-1)}>↑</button>
     <button type="button" className="btn btn-sm btn-outline-secondary" aria-label={tr("down")} onClick={()=>move(b.id,1)}>↓</button>
     <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>onChange(blocks.filter(item=>item.id!==b.id))}>{tr("remove")}</button>
    </div>}
   </div>
   {b.kind==="text"?<p className="mb-1" style={{whiteSpace:"pre-wrap"}}>{b.text||tr("emptyText")}</p>:
    b.kind==="image"?(b.imageUrl?<a href={b.imageUrl} rel="noopener noreferrer" target="_blank">{tr("imageLink")}</a>:<p>{tr("imageMissing")}</p>):
    <p className="mb-1">{b.metricKey||tr("unbound")}: {b.metricKey&&metrics[b.metricKey]?.value!==null&&metrics[b.metricKey]?.value!==undefined?metrics[b.metricKey].value+" "+metrics[b.metricKey].unit:tr("unknown")}</p>}
  </article>)}
 </section>)}
 {selected&&mode!=="preview"&&<aside className="border rounded p-3" aria-label={tr("properties")}>
  <h3 className="h6">{tr("properties")} · {tr(selected.kind)}</h3>
  <label className="d-block mb-2">{tr("title")}<input className="form-control" disabled={readOnly} maxLength={120} value={selected.title} onChange={e=>patch(selected.id,{title:e.target.value})}/></label>
  <label className="d-block mb-2">{tr("width")}<select className="form-select" disabled={readOnly} value={selected.width} onChange={e=>patch(selected.id,{width:e.target.value as "full"|"half"})}><option value="full">{tr("full")}</option><option value="half">{tr("half")}</option></select></label>
  <label className="form-check mb-2"><input type="checkbox" className="form-check-input" disabled={readOnly} checked={selected.visible} onChange={e=>patch(selected.id,{visible:e.target.checked})}/>{tr("visible")}</label>
  {selected.kind==="text"&&<label className="d-block">{tr("text")}<textarea className="form-control" disabled={readOnly} maxLength={12000} rows={5} value={selected.text} onChange={e=>patch(selected.id,{text:e.target.value})}/></label>}
  {(["table","chart","kpi"] as const).includes(selected.kind as "table"|"chart"|"kpi")&&<label className="d-block">{tr("metric")}<select className="form-select" disabled={readOnly} value={selected.metricKey??""} onChange={e=>patch(selected.id,{metricKey:e.target.value||null})}><option value="">{tr("unbound")}</option>{Object.keys(metrics).map(k=><option key={k} value={k}>{k}</option>)}</select></label>}
  {selected.kind==="image"&&<label className="d-block">{tr("imageLink")}<input className="form-control" disabled={readOnly} maxLength={1024} type="url" value={selected.imageUrl??""} onChange={e=>patch(selected.id,{imageUrl:e.target.value||null})}/></label>}
 </aside>}
 </div>;
}
