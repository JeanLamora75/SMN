"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Item={name:string;startOn:string;endOn:string;conflicts:string[]};
type Result={items:Item[];canConfirm:boolean;cadenceRevision:number};
export default function BatchPreviewForm(){
 const [quantity,setQuantity]=useState(2);
 const [startOn,setStartOn]=useState("");
 const [preview,setPreview]=useState<Result|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{let live=true;fetch("/api/admin/kanban-periods").then(r=>r.json()).then(data=>{if(live)setStartOn(data.startOn??"");}).catch(()=>{});return()=>{live=false;};},[]);
 function changeDate(value:string){setStartOn(value);setPreview(null);setError("");}
 function changeQuantity(value:number){setQuantity(value);setPreview(null);setError("");}
 async function show(){
  setError("");setPreview(null);setBusy(true);
  try{
   const r=await fetch("/api/admin/kanban-periods/preview?"+new URLSearchParams({startOn,quantity:String(quantity)}),{cache:"no-store"});
   const data=await r.json();
   if(!r.ok){setError("Dates invalides ou prévisualisation indisponible.");return;}
   setPreview(data);
  }catch{setError("Prévisualisation indisponible.");}finally{setBusy(false);}
 }
 return <section className="smn-panel p-4">
  <Link href="/app/admin/kanban-periods" className="btn btn-link px-0 mb-2">← Période unitaire</Link>
  <h1 className="h3">Prévisualiser un lot Kanban</h1>
  <p className="text-secondary">Aucune période ne sera enregistrée lors de la prévisualisation. La création du lot fera l’objet d’une confirmation distincte.</p>
  <div className="row g-3 align-items-end">
   <div className="col-sm-4"><label className="form-label" htmlFor="batch-count">Nombre de périodes</label>
    <input id="batch-count" className="form-control" type="number" min="1" max="6" step="1" value={quantity} onChange={e=>changeQuantity(Number(e.target.value))}/></div>
   <div className="col-sm-5"><label className="form-label" htmlFor="batch-start">Date initiale</label>
    <input id="batch-start" type="date" className="form-control" value={startOn} onChange={e=>changeDate(e.target.value)}/></div>
   <div className="col-sm-3"><button className="btn btn-primary w-100" disabled={busy||!startOn||!Number.isInteger(quantity)||quantity<1||quantity>6} onClick={show}>Prévisualiser</button></div>
  </div>
  {error&&<div className="alert alert-warning mt-3" role="alert">{error}</div>}
  {preview&&<div className="mt-4">
   <h2 className="h5">Aperçu de {preview.items.length} période(s)</h2>
   <div className="table-responsive"><table className="table table-striped"><thead><tr><th>Nom</th><th>Début</th><th>Fin</th><th>Conflits</th></tr></thead>
    <tbody>{preview.items.map((item,i)=><tr key={i}>
     <td>{item.name}</td><td>{item.startOn}</td><td>{item.endOn}</td>
     <td>{item.conflicts.length?<span className="text-danger">Conflit ({item.conflicts.join(", ")})</span>:<span className="text-success">Aucun</span>}</td>
    </tr>)}</tbody></table></div>
   {!preview.canConfirm&&<p className="alert alert-warning" role="alert">Chevauchement détecté : la confirmation du lot est bloquée. Modifiez la date de départ.</p>}
   {preview.canConfirm&&<p className="text-secondary">Aucun chevauchement. L’aperçu est consultatif : aucun enregistrement n’a été effectué.</p>}
   <button type="button" className="btn btn-outline-secondary" onClick={()=>setPreview(null)}>Fermer l’aperçu</button>
  </div>}
 </section>;
}
