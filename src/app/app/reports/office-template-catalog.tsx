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
 const current=templates.find(model=>model.id===selected);
 const sprintName=cycles.find(item=>item[0]===cycle)?.[1]??"";
 function suggestName(model:OfficeTemplate|undefined,sprint:string){
  setFilename(model&&sprint?(model.name+" - "+sprint).slice(0,120):"");
 }
 async function generate(){
  if(!current||!teamId||!cycle||!filename.trim()||busy)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/reports/office-templates/generate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({modelId:current.id,teamId,cycleId:cycle,filename:filename.trim(),language})
   });
   if(!response.ok)throw Error("office-generation-unavailable");
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
        <button className="btn btn-primary align-self-start" type="button"
         disabled={busy||!filename.trim()} onClick={()=>void generate()}>
         {busy?tr("officeGenerating"):tr("officeGenerate")}
        </button>
       </>}
     </div>}
     {error&&<p role="alert" className="text-danger mt-2 mb-0">{error}</p>}
    </>
   }
  </div>
 </section>;
}
