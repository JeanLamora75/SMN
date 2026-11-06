"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import {formatIndicatorValue} from "@/lib/indicators/format-value";
import styles from "./universal-input.module.css";
type D={id:string;tag:string;name:string;indicator_type:string;formula:string|null};
type Form={revision:number;definitions:D[];values:{indicator_id:string;value:string|null}[]};
type Result={indicatorId:string;kind:string;value?:string;reason?:string;sourceTag?:string};
export default function UniversalIndicatorInput({teamId,cycleType,cycleId,buttonLabel}:{teamId:string;cycleType:"scrum"|"kanban";cycleId:string;buttonLabel?:string}){
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
  <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>{setOpen(true);setMessage("");}}>{buttonLabel??t("indicators.input.open")}</button>
  {message&&!open&&<p role="status">{message}</p>}
  {open&&<dialog ref={dialog} className={styles.dialog} aria-modal="true" aria-labelledby="smn-universal-indicators-title" onCancel={e=>{e.preventDefault();close();}}>
   <div className={styles.shell}>
    <header className={styles.header}>
     <div className={styles.headerIdentity}>
      <span className={styles.headerSymbol} aria-hidden="true">◉</span>
      <div className={styles.headingGroup}>
       <span className={styles.eyebrow}>Cockpit Agile</span>
       <h2 id="smn-universal-indicators-title" className={styles.title}>{t("indicators.input.title")}</h2>
      </div>
     </div>
     <button type="button" className={styles.closeButton} aria-label={t("indicators.input.close")} disabled={busy} onClick={close}>
      <span aria-hidden="true">×</span>
     </button>
    </header>
    <div className={styles.body}>
     {error&&<p role="alert" className="alert alert-danger">{error}</p>}
     {message&&<p role="status" className="alert alert-info">{message}</p>}
     {!form&&!error&&<p role="status">{t("indicators.input.loading")}</p>}
     {form&&<section aria-label={t("indicators.input.title")} className={styles.manualSection}>
      <div className={styles.sectionHeading}>
       <h3 className={styles.sectionTitle}>{t("indicators.input.title")}</h3>
       <span className={styles.sectionCount}>{manual.length}</span>
      </div>
      <div className={styles.inputGrid}>
       {manual.map((d,index)=><label key={d.id} className={styles.inputCard}>
        <span className={styles.indicatorHeading}>
         <span className={styles.indicatorSymbol} aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
         <span className={styles.indicatorLabel}>
          <span className={styles.indicatorName}>{d.name}</span>
          <span className={styles.indicatorTag}>{d.tag}</span>
         </span>
        </span>
        <input className={"form-control "+styles.valueInput} inputMode="decimal" type="text"
         value={draft[d.id]??""} disabled={busy}
         onChange={e=>{setDraft(v=>({...v,[d.id]:e.target.value}));setPreview(null);setSystemRevision(null);}}/>
       </label>)}
      </div>
     </section>}
     {computed.length>0&&<details className={styles.computedSection}>
      <summary className={styles.computedToggle}>
       <span className={styles.computedHeading}>
        <span className={styles.computedIcon} aria-hidden="true">∑</span>
        {t("indicators.input.computed")}
        <span className={styles.computedCount}>{computed.length}</span>
       </span>
       <span className={styles.chevron} aria-hidden="true">⌄</span>
      </summary>
      <div className={styles.computedContent} aria-live="polite">
       {computed.map(d=>{
        const result=preview?.find(x=>x.indicatorId===d.id);
        const label=result?.kind==="available"
         ?formatIndicatorValue(result.value,"fr")
         :result?.reason?t("indicators.input.unavailable")+": "+
          (["missing_source","division_by_zero","dependency_unavailable","invalid_domain"].includes(result.reason)
           ?t(("indicators.input.reasons."+result.reason) as "indicators.input.reasons.missing_source")
           :result.reason)+(result.sourceTag?" ("+result.sourceTag+")":"")
         :t("indicators.input.previewRequired");
        return <div key={d.id} className={styles.computedRow}>
         <div className={styles.computedDescription}>
          <span className={styles.computedTag}>{d.tag}</span>
          <span className={styles.computedName}>{d.name}</span>
         </div>
         <output className={result?.kind==="available"?styles.computedValue:styles.computedUnavailable}>{label}</output>
        </div>;
       })}
      </div>
     </details>}
    </div>
    <footer className={styles.footer}>
     <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={close}>{t("indicators.input.cancel")}</button>
     <button type="button" className="btn btn-outline-primary" disabled={!form||busy||manual.length===0} onClick={()=>void run("preview")}>{t("indicators.input.preview")}</button>
     <button type="button" className="btn btn-primary" disabled={!preview||systemRevision===null||busy} onClick={()=>void run("save")}>{t("indicators.input.save")}</button>
    </footer>
   </div>
  </dialog>}
 </div>;
}
