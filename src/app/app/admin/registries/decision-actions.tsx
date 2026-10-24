"use client";
import Link from "next/link";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
export default function DecisionActions({id,teamId,title,description,canManage,onSaved}:{id:string;teamId:string;title:string;description:string;canManage:boolean;onSaved?:()=>void}){
 const t=useTranslation(),tr=(k:string)=>t(("decisionActions."+k) as Parameters<typeof t>[0]);
 const [open,setOpen]=useState(false),[name,setName]=useState(""),[context,setContext]=useState("");
 const [owner,setOwner]=useState(""),[due,setDue]=useState(""),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const [created,setCreated]=useState<string[]>([]);
 const start=()=>{setName(title.slice(0,240));setContext(description.slice(0,4000));setOwner("");setDue("");setOpen(true);setError(false);};
 const confirm=async()=>{
  if(!name.trim()||busy)return;setBusy(true);setError(false);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/create-action",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,type:"action",title:name,description:context||null,owner:owner||null,
     dueOn:due||null,occurredOn:today(),status:"todo",comment:null})});
   if(!response.ok)throw Error("failed");
   const data=await response.json() as {ok:boolean;id:string};
   if(!data.ok||!data.id)throw Error("failed");
   setCreated(list=>[...list,data.id]);setOpen(false);onSaved?.();
  }catch{setError(true);}finally{setBusy(false);}
 };
 if(!canManage)return null;
 return <section className="card p-3 mt-3"><h2 className="h5">{tr("heading")}</h2><p>{tr("intro")}</p>
  {!open&&<button className="btn btn-outline-primary align-self-start" type="button" onClick={start}>{tr(created.length?"again":"launch")}</button>}
  {open&&<div className="d-grid gap-2">
   <label htmlFor="decision-action-title">{tr("title")}</label><input id="decision-action-title" className="form-control" value={name} maxLength={240} onChange={e=>setName(e.target.value)}/>
   <label htmlFor="decision-action-context">{tr("description")}</label><textarea id="decision-action-context" className="form-control" rows={3} maxLength={4000} value={context} onChange={e=>setContext(e.target.value)}/>
   <label htmlFor="decision-action-owner">{tr("owner")}</label><input id="decision-action-owner" className="form-control" maxLength={200} value={owner} onChange={e=>setOwner(e.target.value)}/>
   <label htmlFor="decision-action-due">{tr("due")}</label><input id="decision-action-due" type="date" className="form-control" value={due} onChange={e=>setDue(e.target.value)}/>
   <div className="d-flex gap-2"><button type="button" className="btn btn-primary" disabled={busy||!name.trim()} onClick={()=>void confirm()}>{tr("confirm")}</button>
    <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>setOpen(false)}>{tr("cancel")}</button></div>
  </div>}
  <ul>{created.map(actionId=><li key={actionId}><Link href={"/app/admin/registries/"+encodeURIComponent(actionId)}>{tr("success")}: {actionId}</Link></li>)}</ul>
  {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 </section>;
}
