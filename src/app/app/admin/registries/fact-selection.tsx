"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Fact={origin:"manual"|"automatic";id:string;title:string;effectiveOn:string;recordedAt:string;invalidated:boolean;hidden:boolean;promoted:boolean;selected:boolean;revision:number;eligible:boolean;selectedByDefault:boolean};
export default function FactSelection({canManage}:{canManage:boolean}){
 const t=useTranslation(),tr=(k:string)=>t(("factSelection."+k) as Parameters<typeof t>[0]);
 const [items,setItems]=useState<Fact[]|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState("");
 const refresh=async()=>{const res=await fetch("/api/admin/registries/fact-selection",{cache:"no-store"});if(!res.ok)throw Error();const result=await res.json() as {items:Fact[]};setItems(result.items);};
 useEffect(()=>{const ctrl=new AbortController();void fetch("/api/admin/registries/fact-selection",{signal:ctrl.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{items:Fact[]}>;}).then(v=>{if(!ctrl.signal.aborted)setItems(v.items);}).catch(()=>{if(!ctrl.signal.aborted)setError(true);});return()=>ctrl.abort();},[]);
 const change=async(f:Fact,key:"hidden"|"promoted"|"selected",value:boolean)=>{
  if(!canManage||busy)return;setBusy(f.origin+f.id);setError(false);
  const next={origin:f.origin,factId:f.id,revision:f.revision,hidden:f.hidden,promoted:f.promoted,selected:f.selected,[key]:value};
  if(next.hidden){next.promoted=false;next.selected=false;}
  try{const res=await fetch("/api/admin/registries/fact-selection",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)});
   if(!res.ok)throw Error();await refresh();
  }catch{setError(true);}finally{setBusy("");}
 };
 return <section className="card p-3 mb-3">
  <h2 className="h5">{tr("heading")}</h2><p className="text-body-secondary">{tr("intro")}</p>
  {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
  {items?.filter(f=>f.eligible).length===0&&<p>{tr("empty")}</p>}
  <div className="table-responsive"><table className="table table-sm align-middle">
   <thead><tr><th>{tr("fact")}</th><th>{tr("origin")}</th><th>{tr("date")}</th><th>{tr("hide")}</th><th>{tr("promote")}</th><th>{tr("select")}</th></tr></thead>
   <tbody>{items?.map(f=><tr key={f.origin+f.id} className={f.eligible?"":"text-body-tertiary"}>
    <td>{f.title}{f.invalidated&&<span className="ms-2">{tr("invalidated")}</span>}</td>
    <td>{tr(f.origin)}</td><td>{f.effectiveOn}</td>
    {(["hidden","promoted","selected"] as const).map(k=><td key={k}><input type="checkbox" className="form-check-input"
      aria-label={tr(k==="hidden"?"hide":k==="promoted"?"promote":"select")+" — "+f.title}
      checked={f[k]} disabled={!canManage||!!busy||f.invalidated&&(k!=="hidden")}
      onChange={e=>void change(f,k,e.target.checked)}/></td>)}
   </tr>)}</tbody>
  </table></div>
  <p className="small text-body-secondary">{tr("preview")}: {items?.filter(f=>f.selectedByDefault).length??0}</p>
 </section>;
}
