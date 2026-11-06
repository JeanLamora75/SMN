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
};

export default function OfficeTemplateCatalog({
 templates,cycles=[],teamId=null,initialLanguage="fr",unavailable=false
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
 const [saved,setSaved]=useState("");
 const [confirmOverwrite,setConfirmOverwrite]=useState<{fingerprint:string;filename:string;directory:string}|null>(null);
 const current=templates.find(model=>model.id===selected);
 const sprintName=cycles.find(item=>item[0]===cycle)?.[1]??"";
 function suggestName(model:OfficeTemplate|undefined,sprint:string){
  setFilename(model&&sprint?(model.name+" - "+sprint).slice(0,120):"");
 }
 async function checkThenSave(){
  if(!current||!teamId||!cycle||!filename.trim()||busy)return;
  setBusy(true);setError("");setSaved("");
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
   setError(response.status===409?tr("officeSaveConflict"):tr("officeSaveError"));
   return;
  }
  const savedInfo=await response.json() as {filename:string;directory:string};
  setConfirmOverwrite(null);setSaved(savedInfo.directory+" / "+savedInfo.filename);
 }
 async function generate(action:"download"|"save"="download",fingerprint?:string){
  if(!current||!teamId||!cycle||!filename.trim()||busy)return;
  setBusy(true);setError("");setSaved("");
  try{
   const response=await fetch("/api/admin/reports/office-templates/generate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({modelId:current.id,teamId,cycleId:cycle,filename:filename.trim(),language,action,expectedFingerprint:fingerprint})
   });
   if(!response.ok)throw Error("office-generation-unavailable");
   if(action==="save"){
    const result=await response.json() as {filename:string;directory:string};
    setConfirmOverwrite(null);
    setSaved(result.directory+" / "+result.filename);
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
     {error&&<p role="alert" className="text-danger mt-2 mb-0">{error}</p>}
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
