"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Relation={id:string;sourceId:string;targetId:string;targetKind:"record"|"goal";sourceTitle:string;targetTitle:string};
export default function RegistryRelations({id,type,canManage}:{id:string;type:string;canManage:boolean}){
 const t=useTranslation(),tr=(k:string)=>t(("registryRelations."+k) as Parameters<typeof t>[0]);
 const [items,setItems]=useState<Relation[]|null>(null),[kind,setKind]=useState<"record"|"goal">("record");
 const [target,setTarget]=useState(""),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const endpoint="/api/admin/registries/"+encodeURIComponent(id)+"/relations";
 const load=async()=>{const r=await fetch(endpoint,{cache:"no-store"});if(!r.ok)throw Error("unavailable");const d=await r.json() as {relations:Relation[]};setItems(d.relations);};
 useEffect(()=>{let alive=true;void fetch(endpoint,{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{relations:Relation[]}>;}).then(d=>{if(alive)setItems(d.relations);}).catch(()=>{if(alive)setError(true);});return()=>{alive=false;};},[endpoint]);
 const change=async(relationTarget:{kind:"record"|"goal";id:string},action:"linked"|"unlinked",sourceId=id)=>{
  setBusy(true);setError(false);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(sourceId)+"/relations",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({target:relationTarget,action})});
   if(!response.ok)throw Error("failed");
   await load();setTarget("");
  }catch{setError(true);}finally{setBusy(false);}
 };
 return <section className="card p-3 mt-3"><h2 className="h5">{tr("heading")}</h2><p className="text-body-secondary">{tr("intro")}</p>
  {items?.length===0&&<p>{tr("empty")}</p>}
  <ul className="list-group">{items?.map(r=><li key={r.id} className="list-group-item d-flex justify-content-between align-items-center gap-2">
   <span>{r.sourceId===id?tr("to"):tr("from")}: {r.sourceId===id?
    r.targetKind==="record"?<Link href={"/app/admin/registries/"+r.targetId}>{r.targetTitle}</Link>:<span>{tr("goal")}: {r.targetTitle}</span>:
    <Link href={"/app/admin/registries/"+r.sourceId}>{r.sourceTitle}</Link>}</span>
   {canManage&&<button type="button" className="btn btn-outline-danger btn-sm" disabled={busy}
    onClick={()=>void change({kind:r.targetKind,id:r.targetId},"unlinked",r.sourceId)}>{tr("remove")}</button>}
  </li>)}</ul>
  {canManage&&<div className="row g-2 align-items-end mt-2">
   <div className="col-md-4"><label className="form-label" htmlFor="relation-kind">{tr("kind")}</label>
    <select id="relation-kind" className="form-select" value={kind} onChange={e=>setKind(e.target.value as "record"|"goal")}>
     <option value="record">{tr("record")}</option>{type==="action"&&<option value="goal">{tr("goal")}</option>}
    </select></div>
   <div className="col-md-6"><label className="form-label" htmlFor="relation-target">{tr("target")}</label>
    <input className="form-control" id="relation-target" maxLength={36} value={target} onChange={e=>setTarget(e.target.value)}/></div>
   <div className="col-md-2"><button className="btn btn-primary" type="button" disabled={busy||!target.trim()}
    onClick={()=>void change({kind,id:target.trim()},"linked")}>{tr("add")}</button></div>
  </div>}
  {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 </section>;
}
