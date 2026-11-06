"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import type {OfficeTemplate} from "@/server/reports/office-catalog";

export default function OfficeTemplateCatalog({templates,unavailable=false}:{
 templates:OfficeTemplate[];unavailable?:boolean;
}){
 const t=useTranslation();
 const tr=(name:string)=>t(("reportsCenter."+name) as Parameters<typeof t>[0]);
 const router=useRouter();
 const [selected,setSelected]=useState<string>("");
 const current=templates.find(m=>m.id===selected);
 return <section className="card mt-3" aria-labelledby="smn-office-templates-title">
  <div className="card-body">
   <div className="d-flex gap-2 align-items-center justify-content-between mb-3">
    <h3 id="smn-office-templates-title" className="h5 mb-0">{tr("officeTemplates")}</h3>
    <button type="button" className="btn btn-sm btn-outline-secondary"
     onClick={()=>{setSelected("");router.refresh();}}>{tr("officeRefresh")}</button>
   </div>
   <p className="text-secondary small">{tr("officeTemplatesHint")}</p>
   {unavailable?<p role="alert" className="alert alert-warning">{tr("officeUnavailable")}</p>:
    templates.length===0?<p className="alert alert-info mb-0">{tr("officeEmpty")}</p>:
    <>
     <label className="form-label" htmlFor="smn-office-model">{tr("officeSelect")}</label>
     <select className="form-select" id="smn-office-model" value={selected}
      onChange={event=>setSelected(event.target.value)}>
      <option value="">{tr("officeChoose")}</option>
      {templates.map(model=><option key={model.id} value={model.id}>{model.name} · {model.format.toUpperCase()}</option>)}
     </select>
     {current&&<p role="status" className="small text-secondary mt-2 mb-0">
      {tr("officeSelected")}: <strong>{current.name}</strong> ({current.format.toUpperCase()})
     </p>}
    </>
   }
  </div>
 </section>;
}
