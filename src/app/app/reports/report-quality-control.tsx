"use client";
import {useState} from "react";
import {inspectDocumentQuality} from "@/lib/report-export-quality";
import {useTranslation} from "@/i18n/client";
export default function ReportQualityControl({content}:{content:unknown}){
 const t=useTranslation(),tr=(key:string)=>t(("reportsQuality."+key) as Parameters<typeof t>[0]);
 const [show,setShow]=useState(false),issues=inspectDocumentQuality(content);
 return <section className="border rounded p-3">
  <div className="d-flex flex-wrap align-items-center gap-2">
   <button type="button" className="btn btn-outline-primary" onClick={()=>setShow(v=>!v)}>{tr("check")} · {issues.length}</button>
   <span className="text-secondary small">{tr("exportUnavailable")}</span>
  </div>
  {show&&<div className="mt-3">{issues.length===0?<p>{tr("noWarnings")}</p>:
   <ul className="list-group">{issues.map((issue,i)=><li className="list-group-item" key={issue.code+i}>
    <strong>{tr(issue.code)}</strong> · {issue.target} · {issue.severity==="error"?tr("error"):tr("warning")}
   </li>)}</ul>}
   <p className="text-secondary mt-2 mb-0">{tr("noEditorialGuarantee")}</p>
  </div>}
 </section>;
}
