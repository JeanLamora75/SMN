"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
type Definition={id:string;tag:string;name:string;unit_short:string;archived_at:string|null};
type Data={definitions:Definition[];selections:{indicator_id:string;is_active:boolean}[];preferences:{indicator_id:string;screen_key:string;is_visible:boolean;display_order:number}[]};
export default function FreezeReportButton({sprintId,teamId,label,errorLabel,locale="fr"}:{sprintId:string;teamId?:string;label:string;errorLabel:string;locale?:"fr"|"en"}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState(false),[data,setData]=useState<Data|null>(null),[selected,setSelected]=useState<string[]>([]),[loaded,setLoaded]=useState(false);
 const tr=(fr:string,en:string)=>locale==="fr"?fr:en;
 useEffect(()=>{if(!teamId)return;const ctrl=new AbortController();
  void fetch("/api/admin/indicators/catalog?teamId="+encodeURIComponent(teamId),{cache:"no-store",signal:ctrl.signal})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Data>;})
   .then(d=>{if(ctrl.signal.aborted)return;const active=new Set(d.selections.filter(x=>x.is_active).map(x=>x.indicator_id));
    const preferred=d.preferences.filter(x=>x.screen_key==="reports"&&x.is_visible&&active.has(x.indicator_id)).sort((a,b)=>a.display_order-b.display_order);
    setSelected(preferred.map(x=>x.indicator_id));setData(d);setLoaded(true);
   }).catch(()=>{if(!ctrl.signal.aborted)setLoaded(false);});
  return()=>ctrl.abort();
 },[teamId]);
 const available=(data?.definitions??[]).filter(d=>!d.archived_at&&data?.selections.some(s=>s.indicator_id===d.id&&s.is_active));
 const custom=loaded&&data!==null;
 const preview="/app/admin/sprints/"+encodeURIComponent(sprintId)+"/report/preview"+(custom?"?indicators="+encodeURIComponent(selected.join(",")):"");
 const move=(id:string,dir:number)=>setSelected(previous=>{const values=[...previous],i=values.indexOf(id),j=i+dir;if(i<0||j<0||j>=values.length)return previous;[values[i],values[j]]=[values[j],values[i]];return values;});
 async function freeze(){
  setBusy(true);setError(false);
  try{
   if(teamId&&!loaded)throw Error("indicators-unavailable");
   const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/render-references"+(custom?"?indicators="+encodeURIComponent(selected.join(",")):""),{method:"POST"});
   if(!r.ok)throw Error("freeze-failed");
   const result=await r.json() as {id:string};
   if(!/^[a-f0-9-]{36}$/i.test(result.id))throw Error("freeze-invalid");
   router.push("/app/admin/sprints/"+encodeURIComponent(sprintId)+"/report/preview?reference="+encodeURIComponent(result.id));
  }catch{setError(true);}finally{setBusy(false);}
 }
 return <div className="d-grid gap-2">
  {teamId&&<details className="border rounded-3 p-2 bg-body">
   <summary>{tr("Indicateurs du rapport (sélection ponctuelle)","Report indicators (one-time selection)")}</summary>
   {!loaded?<p role="status">{tr("Catalogue indisponible : sélection impossible.","Catalog unavailable: selection disabled.")}</p>:<>
    <p className="small text-secondary">{tr("Ces choix ne modifient pas les préférences de l’équipe.","These choices do not change team preferences.")}</p>
    {available.map(d=><div key={d.id} className="d-flex align-items-center gap-2 py-1">
     <label className="d-flex align-items-center gap-2 flex-grow-1"><input type="checkbox" checked={selected.includes(d.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,d.id]:old.filter(x=>x!==d.id))}/><span title={d.name}>{d.tag} — {d.name}{d.unit_short?" ("+d.unit_short+")":""}</span></label>
     {selected.includes(d.id)&&<><button type="button" className="btn btn-outline-secondary btn-sm" aria-label={tr("Monter ","Move up ")+d.tag} onClick={()=>move(d.id,-1)}>↑</button><button type="button" className="btn btn-outline-secondary btn-sm" aria-label={tr("Descendre ","Move down ")+d.tag} onClick={()=>move(d.id,1)}>↓</button></>}
    </div>)}
    <p className="small">{tr("Ordre sélectionné : ","Selected order: ")}{selected.map(id=>available.find(d=>d.id===id)?.tag).join(" → ")||"—"}</p>
   </>}
  </details>}
  <div className="d-flex gap-2 flex-wrap align-items-center">
   <Link href={preview} className="btn btn-outline-secondary">{tr("Aperçu HTML ponctuel","One-time HTML preview")}</Link>
   <button className="btn btn-outline-primary" type="button" disabled={busy||!!teamId&&!loaded} onClick={()=>void freeze()}>{label}</button>
  </div>
  {error&&<span role="alert" className="text-danger">{errorLabel}</span>}
 </div>;
}
