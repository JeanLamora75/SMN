"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function HistoricalCapacityForm({sprintId,revision=0,initialQuality="not-supplied",initialJh=null,initialSource=null}:{sprintId:string;revision?:number;initialQuality?:"known"|"estimated"|"not-supplied";initialJh?:number|null;initialSource?:string|null}){
 const router=useRouter();
 const [quality,setQuality]=useState<"known"|"estimated"|"not-supplied">(initialQuality);
 const [jh,setJh]=useState(initialJh===null?"":String(initialJh)),[source,setSource]=useState(initialSource??""),[reason,setReason]=useState("");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[currentRevision,setCurrentRevision]=useState(revision);
 async function save(e:React.FormEvent){
  e.preventDefault();setMessage("");
  const qualifiedJh=quality==="not-supplied"?null:jh.trim()?Number(jh):NaN;
  if(qualifiedJh!==null&&(!Number.isFinite(qualifiedJh)||qualifiedJh<0)){setMessage("Valeur J/H invalide.");return;}
  setBusy(true);
  try{
   const res=await fetch("/api/admin/sprints/historical-capacity",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sprintId,quality,qualifiedJh,source,reason,revision:currentRevision})});
   const json=await res.json() as {ok?:boolean;revision?:number;error?:string};
   if(!res.ok||!json.ok){setMessage(json.error==="conflict"?"Cette capacité a été modifiée. Actualisez la fiche.":"Enregistrement refusé.");return;}
   setCurrentRevision(json.revision??currentRevision+1);
   setMessage("Qualification historique enregistrée et auditée.");router.refresh();
  }catch{setMessage("Service indisponible.");}finally{setBusy(false);}
 }
 return <section className="border rounded p-3 mt-3">
 <h3 className="h6">Capacité initiale historique</h3>
 <p className="small text-secondary">Aucun calcul à partir de l'équipe actuelle. « Absente » ne signifie pas zéro J/H. Une estimation n'est pas une mesure attestée.</p>
 <form className="row g-2" onSubmit={save}>
  <label className="col-md-4">Qualité<select className="form-select" value={quality} onChange={e=>setQuality(e.target.value as typeof quality)}>
   <option value="not-supplied">Absente / inconnue</option><option value="known">Connue</option><option value="estimated">Estimée</option>
  </select></label>
  {quality!=="not-supplied"&&<label className="col-md-3">Capacité prévue (J/H)<input type="number" className="form-control" min={0} max={99999999} step="0.0001" required value={jh} onChange={e=>setJh(e.target.value)}/></label>}
  <label className="col-md-5">Source (facultative)<input className="form-control" maxLength={500} value={source} onChange={e=>setSource(e.target.value)}/></label>
  <label className="col-12">Motif / contexte (facultatif)<textarea className="form-control" maxLength={1000} rows={2} value={reason} onChange={e=>setReason(e.target.value)}/></label>
  <div className="col-12"><button className="btn btn-primary btn-sm" disabled={busy}>{busy?"Enregistrement…":"Enregistrer la qualification"}</button></div>
 </form>
 {message&&<p className="small mt-2" role="status">{message}</p>}
 </section>;
}
