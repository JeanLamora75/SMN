"use client";
import {useEffect,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Counts={initial:number|null;done:number|null};
type Sprint={id:string;name:string;status:string};
const empty:Counts={initial:null,done:null};

export default function TicketCountsForm({canManage}:{canManage:boolean}){
 const t=useTranslation();
 const [sprints,setSprints]=useState<Sprint[]>([]);
 const [sprintId,setSprintId]=useState(""),[sprintStatus,setSprintStatus]=useState("");
 const [counts,setCounts]=useState<Counts>(empty),[saved,setSaved]=useState<Counts>(empty);
 const [revision,setRevision]=useState(0),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const dirty=JSON.stringify(counts)!==JSON.stringify(saved);
 const requestId=useRef(0);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/sprints/states",{cache:"no-store",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{sprints:Sprint[]}>;})
   .then(result=>{if(!controller.signal.aborted)setSprints(result.sprints??[]);})
   .catch(()=>{if(!controller.signal.aborted)setError(t("sprintTickets.error"));});
  return()=>controller.abort();
 },[t]);
 useEffect(()=>{
  const handler=(e:BeforeUnloadEvent)=>{
   if(dirty){e.preventDefault();e.returnValue="";}
  };
  window.addEventListener("beforeunload",handler);
  return()=>window.removeEventListener("beforeunload",handler);
 },[dirty]);
 async function choose(id:string){
  const token=++requestId.current;
  setSprintId(id);setCounts(empty);setSaved(empty);
  setRevision(0);setSprintStatus("");setError("");setNotice("");
  if(!id)return;
  setBusy(true);
  try{
   const response=await fetch("/api/admin/sprints/tickets?sprintId="+encodeURIComponent(id),
    {cache:"no-store"});
   if(!response.ok)throw Error();
   const result=await response.json() as {
    sprint:{status:string};counts:Counts;revision:number
   };
   if(token!==requestId.current)return;
   setCounts(result.counts);setSaved(result.counts);
   setRevision(result.revision);setSprintStatus(result.sprint.status);
  }catch{if(token===requestId.current)setError(t("sprintTickets.error"));}
  finally{if(token===requestId.current)setBusy(false);}
 }
 async function save(){
  if(!sprintId||!canManage||busy||sprintStatus==="closed")return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin/sprints/tickets",{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sprintId,revision,counts})
   });
   if(!response.ok)throw Error();
   const result=await response.json() as {revision:number};
   if(!Number.isSafeInteger(result.revision))throw Error();
   setRevision(result.revision);
   setSaved({...counts});
   setNotice(t("sprintTickets.saved"));
  }catch{setError(t("sprintTickets.error"));}
  finally{setBusy(false);}
 }
 const disabled=busy||!canManage||sprintStatus==="closed";
 return <section className="smn-panel p-4 mt-4" aria-labelledby="smn-sprint-tickets-title">
  <h2 className="h4" id="smn-sprint-tickets-title">{t("sprintTickets.title")}</h2>
  <p className="text-secondary">{t("sprintTickets.description")}</p>
  <label htmlFor="smn-tickets-sprint" className="form-label">{t("sprintTickets.sprint")}</label>
  <select id="smn-tickets-sprint" className="form-select" disabled={busy} value={sprintId}
   onChange={e=>{if(!dirty||window.confirm(t("sprintReview.discard")))void choose(e.target.value);}}>
   <option value="">—</option>
   {sprints.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
  </select>
  {dirty&&<p className="text-warning small" role="status">{t("sprintReview.unsaved")}</p>}
  {sprintId&&<div className="row g-3 mt-2">
   {(["initial","done"] as const).map(key=>
    <div className="col-md-6" key={key}>
     <label htmlFor={"smn-tickets-"+key} className="form-label">
      {t(key==="initial"?"sprintTickets.initial":"sprintTickets.done")}
     </label>
     <input type="number" className="form-control" min={0} max={1000000000} step={1}
      id={"smn-tickets-"+key} disabled={disabled}
      value={counts[key]??""}
      onChange={e=>setCounts(prev=>({...prev,[key]:
       e.target.value===""?null:Number(e.target.value)}))}/>
    </div>)}
   <p className="text-secondary small">{t("sprintTickets.noSource")}</p>
   {canManage&&<div><button type="button" className="btn btn-primary"
    disabled={disabled||!dirty} onClick={()=>void save()}>{t("sprintTickets.save")}</button></div>}
  </div>}
  {error&&<p role="alert" className="alert alert-danger mt-3">{error}</p>}
  {notice&&<p role="status" className="alert alert-success mt-3">{notice}</p>}
 </section>;
}
