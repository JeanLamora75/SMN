"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
type D={id:string;tag:string;name:string;indicator_type:string;formula:string|null};
type Form={revision:number;definitions:D[];values:{indicator_id:string;value:string|null}[]};
type Result={indicatorId:string;kind:string;value?:string;reason?:string;sourceTag?:string};
export default function UniversalIndicatorInput({teamId,cycleType,cycleId}:{teamId:string;cycleType:"scrum"|"kanban";cycleId:string}){
 const t=useTranslation(),router=useRouter(),dialog=useRef<HTMLDialogElement>(null);
 const [open,setOpen]=useState(false),[form,setForm]=useState<Form|null>(null),[draft,setDraft]=useState<Record<string,string>>({}),[preview,setPreview]=useState<Result[]|null>(null),[systemRevision,setSystemRevision]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 useEffect(()=>{if(!open)return;const node=dialog.current;if(node&&!node.open)node.showModal();return()=>{if(node?.open)node.close();};},[open]);
 useEffect(()=>{if(!open)return;const controller=new AbortController();
  void fetch("/api/admin/indicators/input?"+new URLSearchParams({teamId,cycleType,cycleId}),{cache:"no-store",signal:controller.signal})
   .then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d as Form;})
   .then(d=>{if(controller.signal.aborted)return;setForm(d);setDraft(Object.fromEntries(d.values.map(v=>[v.indicator_id,v.value??""])));setPreview(null);setSystemRevision(null);setError("");})
   .catch(e=>{if(!controller.signal.aborted)setError(String(e));});
  return ()=>controller.abort();
 },[open,teamId,cycleType,cycleId]);
 useEffect(()=>{
  if(!open||!form||!form.definitions.some(d=>d.indicator_type==="manual"))return;
  const ctrl=new AbortController();
  const timeout=setTimeout(()=>{
   const changes=form.definitions.filter(d=>d.indicator_type==="manual").map(d=>({indicatorId:d.id,value:(draft[d.id]??"").trim()||null}));
   void fetch("/api/admin/indicators/input",{method:"POST",headers:{"content-type":"application/json"},signal:ctrl.signal,body:JSON.stringify({action:"preview",teamId,cycleType,cycleId,expectedRevision:form.revision,changes})})
    .then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error??"unavailable");return data as {results:Result[];systemRevision:number};})
    .then(data=>{if(!ctrl.signal.aborted){setPreview(data.results);setSystemRevision(data.systemRevision);setError("");}})
    .catch(e=>{if(!ctrl.signal.aborted){setPreview(null);setSystemRevision(null);setError(String(e));}});
  },300);
  return ()=>{clearTimeout(timeout);ctrl.abort();};
 },[open,form,draft,teamId,cycleType,cycleId]);
 const manual=form?.definitions.filter(d=>d.indicator_type==="manual")??[];
 const computed=form?.definitions.filter(d=>d.indicator_type==="computed")??[];
 function close(){if(busy)return;setOpen(false);setForm(null);setPreview(null);setSystemRevision(null);setError("");}
 async function run(action:"preview"|"save"){
  if(!form)return;setBusy(true);setError("");setMessage("");
  const changes=manual.map(d=>({indicatorId:d.id,value:(draft[d.id]??"").trim()||null}));
  try{const r=await fetch("/api/admin/indicators/input",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,teamId,cycleType,cycleId,expectedRevision:form.revision,expectedSystemRevision:action==="save"?systemRevision:undefined,changes})});
   const data=await r.json();if(!r.ok||data.ok===false)throw Error(data.error??"unavailable");
   if(action==="preview"){setPreview(data.results);setSystemRevision(data.systemRevision);setMessage(t("indicators.input.previewReady"));}
   else{setOpen(false);setForm(null);setPreview(null);setSystemRevision(null);window.dispatchEvent(new CustomEvent("smn:indicators-saved",{detail:{teamId,cycleType,cycleId}}));router.refresh();setMessage(t("indicators.input.saved"));}
  }catch(e){setPreview(null);setSystemRevision(null);setError(e instanceof Error?e.message:"unavailable");}finally{setBusy(false);}
 }
 return <div>
  <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>{setOpen(true);setMessage("");}}>{t("indicators.input.open")}</button>
  {message&&!open&&<p role="status">{message}</p>}
  {open&&<dialog ref={dialog} className="smn-indicator-universal-dialog" aria-modal="true" aria-labelledby="smn-universal-indicators-title" onCancel={e=>{e.preventDefault();close();}} style={{border:0,borderRadius:12,padding:0,width:"min(90vw,900px)",maxWidth:"900px"}}>
   <div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content">
    <div className="modal-header"><h2 className="modal-title h5" id="smn-universal-indicators-title">{t("indicators.input.title")}</h2>
     <button type="button" className="btn-close" aria-label={t("indicators.input.close")} onClick={close}/></div>
    <div className="modal-body">
     {error&&<p role="alert" className="alert alert-danger">{error}</p>}
     {message&&<p role="status" className="alert alert-info">{message}</p>}
     {!form&&!error&&<p role="status">{t("indicators.input.loading")}</p>}
     {manual.map(d=><label key={d.id} className="form-label d-block">{d.tag} — {d.name}
      <input className="form-control" inputMode="decimal" type="text" value={draft[d.id]??""} onChange={e=>{setDraft(v=>({...v,[d.id]:e.target.value}));setPreview(null);setSystemRevision(null);}}/></label>)}
     {computed.length>0&&<section aria-label={t("indicators.input.computed")} aria-live="polite" className="border rounded-3 p-3">
      <h3 className="h6">{t("indicators.input.computed")}</h3>
      {computed.map(d=>{const result=preview?.find(x=>x.indicatorId===d.id);return <p key={d.id}>{d.tag} — {d.name} : {result?.kind==="available"?result.value:result?.reason? t("indicators.input.unavailable")+": "+( ["missing_source","division_by_zero","dependency_unavailable","invalid_domain"].includes(result.reason)?t(("indicators.input.reasons."+result.reason) as "indicators.input.reasons.missing_source"):result.reason)+(result.sourceTag?" ("+result.sourceTag+")":""):t("indicators.input.previewRequired")}</p>;})}
     </section>}
    </div>
    <div className="modal-footer">
     <button type="button" className="btn btn-outline-secondary" onClick={()=>setOpen(false)}>{t("indicators.input.cancel")}</button>
     <button type="button" className="btn btn-outline-primary" disabled={!form||busy||manual.length===0} onClick={()=>void run("preview")}>{t("indicators.input.preview")}</button>
     <button type="button" className="btn btn-primary" disabled={!preview||systemRevision===null||busy} onClick={()=>void run("save")}>{t("indicators.input.save")}</button>
    </div>
   </div></div>
  </dialog>}
 </div>;
}
