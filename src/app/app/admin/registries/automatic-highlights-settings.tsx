"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {automaticHighlightCategories,defaultHighlightCategories,type AutomaticHighlightCategory} from "@/lib/automatic-highlights";
type Config=Record<AutomaticHighlightCategory,boolean>;
export default function AutomaticHighlightsSettings({canManage}:{canManage:boolean}){
 const t=useTranslation(),tr=(key:string)=>t(("automaticHighlights."+key) as Parameters<typeof t>[0]);
 const [categories,setCategories]=useState<Config>({...defaultHighlightCategories});
 const [revision,setRevision]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[saved,setSaved]=useState(false);
 useEffect(()=>{const ctrl=new AbortController();
  void fetch("/api/admin/registries/automatic-highlights",{signal:ctrl.signal,cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<{categories:Config;revision:number}>;})
   .then(v=>{if(!ctrl.signal.aborted){setCategories(v.categories);setRevision(v.revision);}})
   .catch(()=>{if(!ctrl.signal.aborted)setError(true);});
  return()=>ctrl.abort();
 },[]);
 const save=async()=>{if(revision===null||busy||!canManage)return;setBusy(true);setError(false);setSaved(false);
  try{const response=await fetch("/api/admin/registries/automatic-highlights",{
   method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({categories,revision})});
   if(!response.ok)throw Error("failed");
   const result=await response.json() as {ok:boolean;revision:number};
   if(!result.ok)throw Error("failed");setRevision(result.revision);setSaved(true);
  }catch{setError(true);}finally{setBusy(false);}
 };
 return <section className="card p-3 mb-3"><h2 className="h5">{tr("heading")}</h2><p className="text-body-secondary">{tr("intro")}</p>
  {!canManage&&<p>{tr("readonly")}</p>}
  {automaticHighlightCategories.map(k=><div className="form-check form-switch mb-2" key={k}>
   <input type="checkbox" role="switch" className="form-check-input" id={"highlight-"+k}
    checked={categories[k]} disabled={revision===null||!canManage||busy}
    onChange={e=>{setCategories(v=>({...v,[k]:e.target.checked}));setSaved(false);}}/>
   <label className="form-check-label" htmlFor={"highlight-"+k}>{tr(k)}</label>
  </div>)}
  {canManage&&<button type="button" className="btn btn-outline-primary align-self-start" disabled={revision===null||busy} onClick={()=>void save()}>{tr("save")}</button>}
  {saved&&<p role="status" className="text-success">{tr("saved")}</p>}
  {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 </section>;
}
