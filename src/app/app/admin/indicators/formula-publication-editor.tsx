"use client";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
type Preview={globalRevision:string;fingerprint:string;indicatorId:string;formula:string;affectedIndicators:string[];cycles:number;results:number;unavailable:number};
export default function FormulaPublicationEditor({indicatorId,initialFormula,onPublished}:{indicatorId:string;initialFormula:string;onPublished:()=>Promise<void>}){
 const t=useTranslation(),[formula,setFormula]=useState(initialFormula),[preview,setPreview]=useState<Preview|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function call(action:"preview"|"publish"){
  setBusy(true);setError("");setMessage("");
  try{
   const body=action==="preview"?{action,indicatorId,formula}:{action,indicatorId,formula,confirmation:{globalRevision:preview!.globalRevision,fingerprint:preview!.fingerprint}};
   const response=await fetch("/api/admin/indicators/formulas",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
   const data=await response.json() as Preview&{ok?:boolean;error?:string};
   if(!response.ok)throw Error(data.error??"service-unavailable");
   if(action==="preview"){setPreview(data);setMessage(t("indicators.previewReady"));}
   else{setPreview(null);setMessage(t("indicators.published"));await onPublished();}
  }catch(e){setError(e instanceof Error?e.message:"service-unavailable");setPreview(null);}
  finally{setBusy(false);}
 }
 return <section aria-label={t("indicators.formulaEditor")} className="smn-panel rounded-4 p-3 mt-3">
  <h3 className="h6">{t("indicators.formulaEditor")}</h3>
  <label className="form-label d-block">{t("indicators.formula")}<textarea className="form-control mt-1" maxLength={4096} value={formula} onChange={e=>{setFormula(e.target.value);setPreview(null);}}/></label>
  {error&&<p role="alert" className="alert alert-danger">{t("indicators.error")}: {error}</p>}
  {message&&<p role="status" className="alert alert-info">{message}</p>}
  {preview&&<div role="region" aria-label={t("indicators.previewSummary")} className="border rounded-3 p-3 my-2">
   <p className="fw-semibold">{t("indicators.previewSummary")}</p>
   <dl className="row mb-2">
    <dt className="col-sm-6">{t("indicators.impactedIndicators")}</dt><dd className="col-sm-6">{preview.affectedIndicators.length}</dd>
    <dt className="col-sm-6">{t("indicators.cycles")}</dt><dd className="col-sm-6">{preview.cycles}</dd>
    <dt className="col-sm-6">{t("indicators.results")}</dt><dd className="col-sm-6">{preview.results}</dd>
    <dt className="col-sm-6">{t("indicators.unavailable")}</dt><dd className="col-sm-6">{preview.unavailable}</dd>
   </dl>
   <button type="button" className="btn btn-primary" disabled={busy} onClick={()=>{if(window.confirm(t("indicators.confirmPublish")))void call("publish");}}>{t("indicators.publish")}</button>
  </div>}
  <button type="button" className="btn btn-outline-secondary" disabled={busy||!formula.trim()||formula===initialFormula} onClick={()=>void call("preview")}>{t("indicators.preview")}</button>
 </section>;
}
