"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import type {OfficeTemplate} from "@/server/reports/office-catalog";

type Language="fr"|"en";
type Props={
 templates:OfficeTemplate[];
 cycles?:Array<[string,string]>;
 teamId?:string|null;
 initialLanguage?:"fr"|"en";
 unavailable?:boolean;
 directories?:{templates:string;reports:string}|null;
};

export default function OfficeTemplateCatalog({
 templates,cycles=[],teamId=null,initialLanguage="fr",unavailable=false,directories=null
}:Props){
 const t=useTranslation();
 const tr=(name:string)=>t(("reportsCenter."+name) as Parameters<typeof t>[0]);
 const router=useRouter();
 const [selected,setSelected]=useState("");
 const [cycle,setCycle]=useState(cycles[0]?.[0]??"");
 const [filename,setFilename]=useState("");
 const [language,setLanguage]=useState<Language>(initialLanguage);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [missingChartTag,setMissingChartTag]=useState<string|null>(null);
 const [saved,setSaved]=useState("");
 const [directoryError,setDirectoryError]=useState("");
 const [openingDirectory,setOpeningDirectory]=useState<"templates"|"reports"|null>(null);
 const [confirmOverwrite,setConfirmOverwrite]=useState<{fingerprint:string;filename:string;directory:string}|null>(null);
 const current=templates.find(model=>model.id===selected);
 const sprintName=cycles.find(item=>item[0]===cycle)?.[1]??"";
 async function openDirectory(kind:"templates"|"reports"){
  if(openingDirectory)return;
  setOpeningDirectory(kind);setDirectoryError("");
  try{
   const response=await fetch("/api/admin/reports/office-templates/open-directory",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({kind})
   });
   if(!response.ok){
    const result=await response.json() as {error?:string};
    setDirectoryError(tr(result.error==="unsupported-platform"?"officeExplorerUnsupported":"officeExplorerError"));
   }
  }catch{setDirectoryError(tr("officeExplorerError"));}
  finally{setOpeningDirectory(null);}
 }
 function suggestName(model:OfficeTemplate|undefined,sprint:string){
  setFilename(model&&sprint?(model.name+" - "+sprint).slice(0,120):"");
 }
 async function reportGenerationFailure(response:Response,fallback:string){
  const result=await response.json().catch(()=>null) as {error?:string;tag?:string}|null;
  if(result?.error==="office-chart-indicator-unavailable"&&
    typeof result.tag==="string"&&/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(result.tag)){
   setMissingChartTag(result.tag);
   setError(tr("officeChartIndicatorUnavailable"));return;
  }
  if(result?.error==="office-chart-invalid-target"){
   setError(tr("officeChartTargetInvalid"));return;
  }
  if(result?.error==="office-chart-render-failed"){
   setError(tr("officeChartRenderFailed"));return;
  }
  if(result?.error==="office-chart-insertion-failed"){
   setError(tr("officeChartInsertionFailed"));return;
  }
  setError(fallback);
 }
 async function checkThenSave(){
  if(!current||!teamId||!cycle||!filename.trim()||busy)return;
  setBusy(true);setError("");setMissingChartTag(null);setSaved("");
  try{
   const response=await fetch("/api/admin/reports/office-templates/generate",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({modelId:current.id,teamId,cycleId:cycle,filename:filename.trim(),language,action:"check"})
   });
   if(!response.ok)throw Error("office-check-failed");
   const info=await response.json() as {exists:boolean;fingerprint:string;filename:string;directory:string};
   if(info.exists){setConfirmOverwrite(info);return;}
   await saveAfterCheck(info.fingerprint);
  }catch{setError(tr("officeSaveError"));}
  finally{setBusy(false);}
 }
 async function saveAfterCheck(fingerprint:string){
  if(!current||!teamId||!cycle||!filename.trim())return;
  const response=await fetch("/api/admin/reports/office-templates/generate",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({modelId:current.id,teamId,cycleId:cycle,filename:filename.trim(),language,action:"save",expectedFingerprint:fingerprint})
  });
  if(!response.ok){
   setConfirmOverwrite(null);
   if(response.status===409)setError(tr("officeSaveConflict"));
   else await reportGenerationFailure(response,tr("officeSaveError"));
   return;
  }
  const savedInfo=await response.json() as {filename:string;directory:string};
  setConfirmOverwrite(null);setSaved(savedInfo.directory+" / "+savedInfo.filename);
 }
 async function generate(){
  if(!current||!teamId||!cycle||!filename.trim()||busy)return;
  setBusy(true);setError("");setSaved("");
  try{
   const response=await fetch("/api/admin/reports/office-templates/generate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({modelId:current.id,teamId,cycleId:cycle,filename:filename.trim(),language,action:"download"})
   });
   if(!response.ok){
    await reportGenerationFailure(response,tr("officeGenerationError"));
    return;
   }
   const blob=await response.blob();
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=url;
   link.download=filename.trim().replace(/\.(docx|pptx)$/i,"")+"."+current.format;
   document.body.append(link);
   link.click();
   link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch{setError(tr("officeGenerationError"));}
  finally{setBusy(false);}
 }
 return <section className="card mt-3" aria-labelledby="smn-office-templates-title">
  <div className="card-body">
   <div className="d-flex gap-2 align-items-center justify-content-between mb-3">
    <h3 id="smn-office-templates-title" className="h5 mb-0">{tr("officeTemplates")}</h3>
    <button type="button" className="btn btn-sm btn-outline-secondary"
     onClick={()=>{setSelected("");setError("");router.refresh();}}>{tr("officeRefresh")}</button>
   </div>
   <p className="text-secondary small">{tr("officeTemplatesHint")}</p>
   <div className="row g-2 mb-3">
    <div className="col-12 col-lg-6"><div className="border rounded-3 p-3 h-100">
     <div className="fw-semibold small mb-2">{tr("officeTemplateDirectory")}</div>
     <div className="d-flex align-items-center gap-2">
      <button type="button" className="btn btn-sm btn-outline-secondary flex-shrink-0 d-inline-flex align-items-center justify-content-center"
       disabled={!directories?.templates||openingDirectory!==null}
       title={tr("officeOpenDirectory")} aria-label={tr("officeOpenDirectory")+" — "+tr("officeTemplateDirectory")}
       onClick={()=>void openDirectory("templates")}>
       <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
        <path d="M.54 3.87A1.5 1.5 0 0 1 2.03 2.5h3.14c.4 0 .78.16 1.06.44l.61.61h6.63a1.5 1.5 0 0 1 1.5 1.5v7.45a1.5 1.5 0 0 1-1.5 1.5H2.03a1.5 1.5 0 0 1-1.5-1.5V3.87Zm1.49-.37a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 .5.5h11.44a.5.5 0 0 0 .5-.5V5.05a.5.5 0 0 0-.5-.5H6.43l-.91-.9a.5.5 0 0 0-.35-.15H2.03Z"/>
       </svg>
      </button>
      <code className="d-block text-break user-select-all">{directories?.templates??tr("officeDirectoryUnavailable")}</code>
     </div>
     <div className="text-secondary small mt-2">{tr("officeTemplateDirectoryHint")}</div>
    </div></div>
    <div className="col-12 col-lg-6"><div className="border rounded-3 p-3 h-100">
     <div className="fw-semibold small mb-2">{tr("officeReportsDirectory")}</div>
     <div className="d-flex align-items-center gap-2">
      <button type="button" className="btn btn-sm btn-outline-secondary flex-shrink-0 d-inline-flex align-items-center justify-content-center"
       disabled={!directories?.reports||openingDirectory!==null}
       title={tr("officeOpenDirectory")} aria-label={tr("officeOpenDirectory")+" — "+tr("officeReportsDirectory")}
       onClick={()=>void openDirectory("reports")}>
       <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
        <path d="M.54 3.87A1.5 1.5 0 0 1 2.03 2.5h3.14c.4 0 .78.16 1.06.44l.61.61h6.63a1.5 1.5 0 0 1 1.5 1.5v7.45a1.5 1.5 0 0 1-1.5 1.5H2.03a1.5 1.5 0 0 1-1.5-1.5V3.87Zm1.49-.37a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 .5.5h11.44a.5.5 0 0 0 .5-.5V5.05a.5.5 0 0 0-.5-.5H6.43l-.91-.9a.5.5 0 0 0-.35-.15H2.03Z"/>
       </svg>
      </button>
      <code className="d-block text-break user-select-all">{directories?.reports??tr("officeDirectoryUnavailable")}</code>
     </div>
     <div className="text-secondary small mt-2">{tr("officeReportsDirectoryHint")}</div>
    </div></div>
   </div>
   {directoryError&&<p role="alert" className="alert alert-warning py-2">{directoryError}</p>}
   {unavailable?<p role="alert" className="alert alert-warning">{tr("officeUnavailable")}</p>:
    templates.length===0?<p className="alert alert-info mb-0">{tr("officeEmpty")}</p>:
    <>
     <label className="form-label" htmlFor="smn-office-model">{tr("officeSelect")}</label>
     <select className="form-select" id="smn-office-model" value={selected}
      onChange={event=>{
       const value=event.target.value;
       setSelected(value);setError("");
       suggestName(templates.find(item=>item.id===value),sprintName);
      }}>
      <option value="">{tr("officeChoose")}</option>
      {templates.map(model=><option key={model.id} value={model.id}>{model.name} · {model.format.toUpperCase()}</option>)}
     </select>
     {current&&<div className="mt-3 d-grid gap-2">
      <p role="status" className="small text-secondary mb-0">
       {tr("officeSelected")}: <strong>{current.name}</strong> ({current.format.toUpperCase()})
      </p>
      {!teamId||cycles.length===0?<p className="alert alert-info mb-0">{tr("officeRequiresTeam")}</p>:
       <>
        <label className="form-label" htmlFor="smn-office-cycle">{tr("officeSprint")}
         <select id="smn-office-cycle" className="form-select" value={cycle} onChange={event=>{
          setCycle(event.target.value);
          suggestName(current,cycles.find(item=>item[0]===event.target.value)?.[1]??"");
         }}>
          {cycles.map(([id,name])=><option key={id} value={id}>{name}</option>)}
         </select>
        </label>
        <label className="form-label" htmlFor="smn-office-filename">{tr("officeFilename")}
         <input id="smn-office-filename" type="text" className="form-control"
          required maxLength={120} value={filename} onChange={event=>setFilename(event.target.value)}/>
        </label>
        <label className="form-label" htmlFor="smn-office-language">{tr("officeLanguage")}
         <select id="smn-office-language" className="form-select" value={language}
          onChange={event=>setLanguage(event.target.value as Language)}>
          <option value="fr">Français</option><option value="en">English</option>
         </select>
        </label>
        <p className="text-secondary small mb-0">{tr("officeScalarOnly")}</p>
        <div className="d-flex flex-wrap gap-2">
         <button className="btn btn-outline-primary" type="button" disabled={busy||!filename.trim()}
          onClick={()=>void generate()}>{busy?tr("officeGenerating"):tr("officeGenerate")}</button>
         <button className="btn btn-primary" type="button" disabled={busy||!filename.trim()}
          onClick={()=>void checkThenSave()}>{tr("officeSave")}</button>
        </div>
       </>}
     </div>}
     {error&&<p role="alert" className="text-danger mt-2 mb-0">{error}{missingChartTag&&<>
      {" "}<strong><code className="text-danger">{missingChartTag}</code></strong>
      <span className="d-block small">{tr("officeChartIndicatorHint")}</span>
     </>}</p>}
     {saved&&<p role="status" className="alert alert-success mt-2 mb-0">{tr("officeSaved")}: {saved}</p>}
     {confirmOverwrite&&<div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="office-confirm-title" style={{backgroundColor:"rgba(0,0,0,.55)"}}>
      <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
       <div className="modal-header"><h4 className="modal-title h5" id="office-confirm-title">{tr("officeOverwriteTitle")}</h4></div>
       <div className="modal-body"><p>{tr("officeOverwriteHint")}</p><p className="fw-semibold text-break mb-1">{confirmOverwrite.filename}</p><p className="small text-secondary text-break">{confirmOverwrite.directory}</p></div>
       <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>setConfirmOverwrite(null)}>{tr("officeCancel")}</button>
        <button type="button" className="btn btn-danger" disabled={busy} onClick={()=>{
         setBusy(true);void saveAfterCheck(confirmOverwrite.fingerprint).catch(()=>{setConfirmOverwrite(null);setError(tr("officeSaveError"));}).finally(()=>setBusy(false));
        }}>{tr("officeOverwriteConfirm")}</button>
       </div></div></div>
     </div>}
    </>
   }
  </div>
 </section>;
}
