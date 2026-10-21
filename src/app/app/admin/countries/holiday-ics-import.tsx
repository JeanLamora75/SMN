"use client";
import {useState,type ChangeEvent} from "react";
import {useTranslation} from "@/i18n/client";
import type {TranslationKey} from "@/i18n/catalog";

type Country={code:string;name:string};
type Policy="skip"|"replace";
type Event={id:string;date:string|null;name:string;eligible:boolean;reason:string|null};
type Row={line:number;date:string;name:string;country:string;action:"create"|"replace"|"reject";
 reason:string|null;previousName:string|null};
type Preview={rows:Row[];proposed:number;rejected:number;fingerprint:string;country:string;policy:Policy};
type Result={ok:boolean;error?:string;events?:Event[];preview?:Preview;created?:number;replaced?:number};
const MAX_FILE_BYTES=1024*1024;
const PAGE_SIZE=50;
const EVENT_REASONS:Record<string,string>={
 "recurrence-unsupported":"ics.recurrence",
 "duration-unsupported":"ics.duration",
 "cancelled":"ics.cancelled",
 "timed-or-invalid-start":"ics.timed",
 "multi-day-or-invalid-end":"ics.multiday",
 "invalid-end":"ics.multiday",
 "invalid-name":"ics.noName",
 "malformed-event":"ics.malformed",
 "nested-component":"ics.nested"
};
const CSV_REASONS:Record<string,string>={
 "duplicate-in-file":"countries.csvReasonDuplicate",
 "already-identical":"countries.csvReasonIdentical",
 "existing-date":"countries.csvReasonExisting",
 "invalid-date":"countries.csvReasonDate",
 "invalid-name":"countries.csvReasonName"
};

export default function HolidayIcsImport({countries,onCompleted}:{
 countries:Country[];onCompleted:()=>Promise<void>;
}){
 const t=useTranslation();
 const [country,setCountry]=useState("");
 const [policy,setPolicy]=useState<Policy>("skip");
 const [ics,setIcs]=useState("");
 const [filename,setFilename]=useState("");
 const [events,setEvents]=useState<Event[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [eventPage,setEventPage]=useState(0);
 const [previewPage,setPreviewPage]=useState(0);
 const [notice,setNotice]=useState("");
 const [success,setSuccess]=useState(false);
 const [busy,setBusy]=useState(false);
 function clearAnalysis(){
  setEvents([]);setSelected([]);setPreview(null);
  setEventPage(0);setPreviewPage(0);setNotice("");setSuccess(false);
 }
 async function readFile(event:ChangeEvent<HTMLInputElement>){
  clearAnalysis();setIcs("");setFilename("");
  const file=event.currentTarget.files?.[0];
  if(!file)return;
  if(file.size>MAX_FILE_BYTES){setNotice("ics-too-large");return;}
  try{
   const content=new TextDecoder("utf-8",{fatal:true}).decode(await file.arrayBuffer());
   if(!content){setNotice("invalid-ics");return;}
   setIcs(content);setFilename(file.name);
  }catch{setNotice("invalid-ics");}
 }
 function toggle(id:string,checked:boolean){
  setSelected(previous=>checked?[...previous,id]:previous.filter(x=>x!==id));
  setPreview(null);setPreviewPage(0);setNotice("");
 }
 async function send(stage:"inspect"|"preview"|"commit"){
  if(busy||!ics||!country||(stage!=="inspect"&&selected.length===0)||
   (stage==="commit"&&!preview))return;
  setBusy(true);setNotice("");setSuccess(false);
  try{
   const response=await fetch("/api/admin/countries/import-ics",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({stage,country,policy,ics,selected:stage==="inspect"?[]:selected,
     ...(stage==="commit"?{fingerprint:preview?.fingerprint}:{})})
   });
   const data=await response.json() as Result;
   if(!response.ok||!data.ok){
    if(response.status===409&&data.preview){
     setPreview(data.preview);setPreviewPage(0);setNotice("preview-expired");
    }else setNotice(data.error??"failed");
    return;
   }
   if(stage==="inspect"){
    setEvents(data.events??[]);setSelected([]);setPreview(null);
    setEventPage(0);setNotice("inspected");
   }else if(stage==="preview"){
    setPreview(data.preview??null);setPreviewPage(0);setNotice("previewed");
   }else{
    setEvents([]);setSelected([]);setPreview(null);
    setIcs("");setFilename("");
    setNotice(t("ics.saved").replace("{created}",String(data.created??0))
     .replace("{replaced}",String(data.replaced??0))
     .replace("{rejected}",String(data.preview?.rejected??0)));
    setSuccess(true);
    await onCompleted().catch(()=>undefined);
   }
  }catch{setNotice("failed");}finally{setBusy(false);}
 }
 const eligible=events.filter(x=>x.eligible).length;
 const pages=Math.max(1,Math.ceil(events.length/PAGE_SIZE));
 const previewPages=Math.max(1,Math.ceil((preview?.rows.length??0)/PAGE_SIZE));
 const noticeText=success?notice:({
  inspected:t("ics.inspected"),previewed:t("ics.previewed"),
  "invalid-ics":t("ics.invalidFile"),"ics-too-large":t("ics.tooLarge"),
  "invalid-selection":t("ics.invalidSelection"),"preview-expired":t("countries.csvPreviewExpired"),
  "country-not-found":t("countries.csvMissingCountry"),
  "invalid-input":t("ics.invalidFile"),
  failed:t("countries.failed")
 } as Record<string,string>)[notice]??t("countries.failed");
 return <section className="border-top mt-4 pt-4" aria-labelledby="ics-title">
  <h2 className="h5" id="ics-title">{t("ics.title")}</h2>
  <p>{t("ics.intro")}</p>
  <p className="small text-muted">{t("ics.noSubscriptions")}</p>
  <div className="d-grid gap-2">
   <label htmlFor="ics-country">{t("countries.csvCountry")}</label>
   <select id="ics-country" className="form-select" value={country} disabled={busy}
    onChange={e=>{setCountry(e.target.value);clearAnalysis();}}>
    <option value="">{t("countries.csvSelectCountry")}</option>
    {countries.map(c=><option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
   </select>
   <label htmlFor="ics-file">{t("ics.file")}</label>
   <input id="ics-file" type="file" accept=".ics,text/calendar" className="form-control"
    disabled={busy} onChange={e=>{void readFile(e);}}/>
   <label htmlFor="ics-policy">{t("countries.csvPolicy")}</label>
   <select id="ics-policy" className="form-select" value={policy} disabled={busy}
    onChange={e=>{setPolicy(e.target.value as Policy);setPreview(null);setNotice("");}}>
    <option value="skip">{t("countries.csvSkip")}</option>
    <option value="replace">{t("countries.csvReplace")}</option>
   </select>
   <button className="btn btn-outline-primary" type="button"
    disabled={busy||!ics||!country} onClick={()=>void send("inspect")}>{t("ics.inspect")}</button>
  </div>
  {filename&&<p className="small mt-2">{filename}</p>}
  {notice&&<p role={success?"status":"alert"} className={success?"alert alert-success":"alert alert-info"}>
   {noticeText}
  </p>}
  {events.length>0&&<div className="mt-3">
   <h3 className="h6">{t("ics.events")}</h3>
   <p className="small">{t("ics.eligible").replace("{eligible}",String(eligible))
    .replace("{total}",String(events.length))} — {t("ics.selected").replace("{count}",String(selected.length))}</p>
   <div className="d-flex gap-2 mb-2">
    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy}
     onClick={()=>{setSelected(events.filter(e=>e.eligible).map(e=>e.id));setPreview(null);setNotice("");}}>
     {t("ics.selectEligible")}</button>
    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy}
     onClick={()=>{setSelected([]);setPreview(null);setNotice("");}}>{t("ics.deselect")}</button>
   </div>
   <div className="table-responsive">
    <table className="table table-sm"><thead><tr>
     <th>{t("ics.select")}</th><th>{t("countries.csvDate")}</th>
     <th>{t("countries.csvName")}</th><th>{t("ics.status")}</th>
    </tr></thead><tbody>
     {events.slice(eventPage*PAGE_SIZE,(eventPage+1)*PAGE_SIZE).map(event=>
      <tr key={event.id}>
       <td><input type="checkbox" aria-label={t("ics.select")+" "+event.id}
        disabled={!event.eligible||busy} checked={selected.includes(event.id)}
        onChange={e=>toggle(event.id,e.target.checked)}/></td>
       <td>{event.date??"—"}</td><td>{event.name||"—"}</td>
       <td>{event.eligible?t("ics.valid"):t((EVENT_REASONS[event.reason??""]??"ics.unknown") as TranslationKey)}</td>
      </tr>)}
    </tbody></table>
   </div>
   <div className="d-flex gap-2 align-items-center mb-3">
    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={eventPage===0}
     onClick={()=>setEventPage(p=>Math.max(0,p-1))}>‹</button>
    <span>{eventPage+1}/{pages}</span>
    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={eventPage>=pages-1}
     onClick={()=>setEventPage(p=>Math.min(pages-1,p+1))}>›</button>
   </div>
   <button type="button" className="btn btn-outline-primary" disabled={busy||selected.length===0}
    onClick={()=>void send("preview")}>{t("ics.previewSelected")}</button>
  </div>}
  {preview&&<div className="mt-3">
   <h3 className="h6">{t("ics.confirmationPreview")}</h3>
   <p>{t("countries.csvProposed")}: <strong>{preview.proposed}</strong> — {t("countries.csvRejected")}: <strong>{preview.rejected}</strong></p>
   <div className="table-responsive">
    <table className="table table-sm"><thead><tr>
     <th>{t("countries.csvDate")}</th><th>{t("countries.csvName")}</th><th>{t("countries.csvDecision")}</th>
    </tr></thead><tbody>
     {preview.rows.slice(previewPage*PAGE_SIZE,(previewPage+1)*PAGE_SIZE).map((row,i)=>
      <tr key={row.line+":"+i}>
       <td>{row.date}</td><td>{row.name}</td><td>
        {row.action==="create"?t("countries.csvWillCreate"):
         row.action==="replace"?t("countries.csvWillReplace"):t("countries.csvRejected")}
        {row.reason&&" — "+t((CSV_REASONS[row.reason]??"countries.csvReasonUnknown") as TranslationKey)}
        {row.previousName&&" ("+t("countries.csvPrevious")+": "+row.previousName+")"}
       </td>
      </tr>)}
    </tbody></table>
   </div>
   <div className="d-flex gap-2 align-items-center mb-3">
    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={previewPage===0}
     onClick={()=>setPreviewPage(p=>Math.max(0,p-1))}>‹</button>
    <span>{previewPage+1}/{previewPages}</span>
    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={previewPage>=previewPages-1}
     onClick={()=>setPreviewPage(p=>Math.min(previewPages-1,p+1))}>›</button>
   </div>
   <p className="small text-muted">{t("ics.auditHint")}</p>
   <button type="button" className="btn btn-primary" disabled={busy||preview.proposed===0}
    onClick={()=>void send("commit")}>{t("ics.confirm")}</button>
  </div>}
 </section>;
}
