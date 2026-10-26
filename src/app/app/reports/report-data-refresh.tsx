"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Item={key:string;oldValue:number|null;newValue:number|null;unit:string;comparable:boolean;changed:boolean};
export default function ReportDataRefresh({sprintId,documentId,readOnly}:{sprintId:string;documentId:string;readOnly:boolean}){
 const t=useTranslation(),tr=(k:string)=>t(("reportsRefresh."+k) as Parameters<typeof t>[0]);
 const failedMessage=tr("failed");
 const [result,setResult]=useState<{comparison:Item[]}|null>(null);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 const url="/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/documents/"+encodeURIComponent(documentId)+"/data";
 useEffect(()=>{const ctrl=new AbortController();void fetch(url,{signal:ctrl.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{comparison:Item[]}>;}).then(v=>{if(!ctrl.signal.aborted)setResult(v);}).catch(()=>{if(!ctrl.signal.aborted)setError(failedMessage);});return ()=>ctrl.abort();},[url,failedMessage]);
 const changed=result?.comparison.filter(x=>x.changed)??[];
 const refresh=async()=>{
  if(readOnly||busy||!window.confirm(tr("confirm")))return;
  setBusy(true);setError("");
  try{const r=await fetch(url,{method:"POST"});if(!r.ok)throw Error();window.location.reload();}
  catch{setError(tr("failed"));setBusy(false);}
 };
 return <section className="border rounded p-3 mb-3">
  <h2 className="h6">{tr("heading")}</h2>
  {result&&<p role="status">{changed.length?tr("outdated"):tr("current")}</p>}
  {changed.length>0&&<div className="table-responsive"><table className="table table-sm">
   <thead><tr><th>{tr("metric")}</th><th>{tr("before")}</th><th>{tr("after")}</th></tr></thead>
   <tbody>{changed.map(x=><tr key={x.key}><th>{x.key}{!x.comparable?" · "+tr("notComparable"):""}</th><td>{x.oldValue===null?tr("unknown"):x.oldValue+" "+x.unit}</td><td>{x.newValue===null?tr("unknown"):x.newValue+" "+x.unit}</td></tr>)}</tbody>
  </table></div>}
  {changed.length>0&&!readOnly&&<button className="btn btn-outline-primary" disabled={busy} onClick={()=>void refresh()} type="button">{tr("refresh")}</button>}
  {error&&<p role="alert" className="text-danger">{error}</p>}
 </section>;
}
