"use client";
import {useState,type ChangeEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Country={code:string;name:string};
type Policy="skip"|"replace";
type Line={line:number;date:string;name:string;country:string;
 action:"create"|"replace"|"reject";reason:string|null;previousName:string|null};
type Preview={rows:Line[];proposed:number;rejected:number;fingerprint:string;
 country:string;policy:Policy};
type Result={ok:boolean;error?:string;preview?:Preview;created?:number;replaced?:number};
const PAGE_SIZE=50;
const MAX_FILE_BYTES=1024*1024;

export default function HolidayCsvImport({countries,onCompleted}:{
 countries:Country[];onCompleted:()=>Promise<void>;
}){
 const t=useTranslation();
 const [country,setCountry]=useState("");
 const [policy,setPolicy]=useState<Policy>("skip");
 const [csv,setCsv]=useState("");
 const [filename,setFilename]=useState("");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [notice,setNotice]=useState("");
 const [success,setSuccess]=useState(false);
 const [busy,setBusy]=useState(false);
 const [page,setPage]=useState(0);
 async function selectFile(event:ChangeEvent<HTMLInputElement>){
  const file=event.currentTarget.files?.[0];
  setPreview(null);setPage(0);setNotice("");setSuccess(false);setCsv("");setFilename("");
  if(!file)return;
  if(file.size>MAX_FILE_BYTES){setNotice("too-large");return;}
  try{
   const value=new TextDecoder("utf-8",{fatal:true}).decode(await file.arrayBuffer());
   if(value.length===0){setNotice("invalid-csv");return;}
   setFilename(file.name);setCsv(value);
  }catch{setNotice("invalid-csv");}
 }
 async function process(stage:"preview"|"commit"){
  if(!country||!csv||busy)return;
  if(stage==="commit"&&!preview)return;
  setBusy(true);setNotice("");setSuccess(false);
  try{
   const response=await fetch("/api/admin/countries/import-csv",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({stage,country,policy,csv,
     ...(stage==="commit"?{fingerprint:preview?.fingerprint}:{})})
   });
   const data=await response.json() as Result;
   if(!response.ok||!data.ok){
    if(response.status===409&&data.preview){
     setPreview(data.preview);setPage(0);setNotice("preview-expired");
    }else{setNotice(data.error==="csv-too-large"?"too-large":
     data.error==="invalid-csv"?"invalid-csv":
     data.error==="country-not-found"?"country-not-found":"failed");}
    return;
   }
   if(stage==="preview"){
    setPreview(data.preview??null);setPage(0);setNotice("preview-ready");
   }else{
    setPreview(null);setCsv("");setFilename("");
    setNotice(t("countries.csvSaved").replace("{created}",String(data.created??0))
     .replace("{replaced}",String(data.replaced??0))
     .replace("{rejected}",String(data.preview?.rejected??0)));
    setSuccess(true);
    await onCompleted().catch(()=>undefined);
   }
  }catch{setNotice("failed");}finally{setBusy(false);}
 }
 const totalPages=Math.max(1,Math.ceil((preview?.rows.length??0)/PAGE_SIZE));
 return <section className="mt-4 border-top pt-4" aria-labelledby="csv-import-title">
  <h2 className="h5" id="csv-import-title">{t("countries.csvTitle")}</h2>
  <p>{t("countries.csvIntro")}</p>
  <p className="small"><code>date;nom;pays</code> · <code>2020-05-01;Fête du Travail;FR</code></p>
  <div className="d-grid gap-2">
   <label htmlFor="csv-country">{t("countries.csvCountry")}</label>
   <select id="csv-country" className="form-select" value={country}
    disabled={busy} onChange={e=>{setCountry(e.target.value);setPreview(null);setNotice("");}}>
    <option value="">{t("countries.csvSelectCountry")}</option>
    {countries.map(c=><option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
   </select>
   <label htmlFor="csv-file">{t("countries.csvFile")}</label>
   <input id="csv-file" type="file" accept=".csv,text/csv" className="form-control"
    disabled={busy} onChange={e=>{void selectFile(e);}}/>
   <label htmlFor="csv-policy">{t("countries.csvPolicy")}</label>
   <select id="csv-policy" className="form-select" value={policy} disabled={busy}
    onChange={e=>{setPolicy(e.target.value as Policy);setPreview(null);setNotice("");}}>
    <option value="skip">{t("countries.csvSkip")}</option>
    <option value="replace">{t("countries.csvReplace")}</option>
   </select>
   <button className="btn btn-outline-primary" type="button" disabled={busy||!csv||!country}
    onClick={()=>void process("preview")}>{t("countries.csvPreview")}</button>
  </div>
  {filename&&<p className="small mt-2">{filename}</p>}
  {notice&&<p role={success?"status":"alert"} className={success?"alert alert-success":"alert alert-info"}>
   {notice=== "preview-expired"?t("countries.csvPreviewExpired"):
    notice==="preview-ready"?t("countries.csvPreviewReady"):
    notice==="invalid-csv"?t("countries.csvInvalid"):
    notice==="too-large"?t("countries.csvTooLarge"):
    notice==="country-not-found"?t("countries.csvMissingCountry"):
    notice==="failed"?t("countries.failed"):notice}
  </p>}
  {preview&&<div className="mt-3">
   <p><strong>{t("countries.csvProposed")}: {preview.proposed} — {t("countries.csvRejected")}: {preview.rejected}</strong></p>
   <div className="table-responsive">
    <table className="table table-sm">
     <thead><tr><th>{t("countries.csvLine")}</th><th>{t("countries.csvDate")}</th>
      <th>{t("countries.csvName")}</th><th>{t("countries.csvCountry")}</th>
      <th>{t("countries.csvDecision")}</th></tr></thead>
     <tbody>{preview.rows.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).map((r,i)=>
      <tr key={r.line+":"+i}>
       <td>{r.line}</td><td>{r.date}</td><td>{r.name}</td><td>{r.country}</td>
       <td>{r.action==="reject"?t("countries.csvRejected"):
        r.action==="replace"?t("countries.csvWillReplace"):t("countries.csvWillCreate")}
        {r.reason&&<span> — {r.reason}</span>}
        {r.previousName&&<span> ({t("countries.csvPrevious")}: {r.previousName})</span>}
       </td>
      </tr>)}</tbody>
    </table>
   </div>
   <div className="d-flex align-items-center gap-2 mb-3">
    <button className="btn btn-sm btn-outline-secondary" type="button"
     disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>‹</button>
    <span>{page+1} / {totalPages}</span>
    <button className="btn btn-sm btn-outline-secondary" type="button"
     disabled={page===totalPages-1} onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))}>›</button>
   </div>
   <p className="small text-muted">{t("countries.csvAuditHint")}</p>
   <button className="btn btn-primary" disabled={busy||preview.proposed===0}
    type="button" onClick={()=>void process("commit")}>{t("countries.csvConfirm")}</button>
  </div>}
 </section>;
}
