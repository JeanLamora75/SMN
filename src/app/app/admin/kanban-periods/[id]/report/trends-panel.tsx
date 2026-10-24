"use client";
import {useEffect,useState} from "react";
type Period={id:string;name:string;startOn:string;endOn:string;started:number|null;throughput:number|null;wipFinal:number|null};
const series=[["started","Éléments commencés"],["throughput","Éléments terminés (Throughput)"],["wipFinal","WIP final"]] as const;
export default function KanbanTrendsPanel({periodId}:{periodId:string}){
 const [periods,setPeriods]=useState<Period[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let live=true;fetch("/api/admin/kanban-periods/"+encodeURIComponent(periodId)+"/trends",{cache:"no-store"})
 .then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(live)setPeriods(d.periods);})
 .catch(()=>{if(live)setError("Tendances indisponibles.");}).finally(()=>{if(live)setLoading(false);});
 return()=>{live=false;};},[periodId]);
 if(loading)return <p role="status">Chargement des tendances…</p>;
 if(error)return <p role="alert" className="alert alert-warning">{error}</p>;
 if(!periods.length)return <p className="text-secondary">Aucune période clôturée éligible pour cette comparaison.</p>;
 return <div className="row g-3">
  {series.map(([key,label])=>{
   const known=periods.filter(p=>p[key]!==null);
   const max=Math.max(1,...known.map(p=>p[key]??0));
   return <section className="col-12 col-xl-4" key={key} aria-label={label}>
    <div className="border rounded p-3 h-100">
     <h3 className="h6">{label}</h3>
     <p className="small text-secondary">Nombre d’éléments · périodes clôturées</p>
     {!known.length?<p className="text-secondary">Aucune valeur enregistrée.</p>:
      <div role="img" aria-label={label+" par période : "+periods.map(p=>p.name+" "+(p[key]===null?"non renseigné":p[key])).join("; ")}>
       {periods.map(p=><div className="d-flex align-items-center gap-2 mb-2" key={p.id}>
        <span className="small text-truncate" style={{width:"38%"}} title={p.name}>{p.name}</span>
        <div style={{flex:1,minWidth:0}} className="bg-body-tertiary rounded">
         {p[key]!==null&&<div className="bg-primary rounded" style={{height:16,width:(p[key]===0?0:Math.max(2,(p[key]/max)*100))+"%"}}/>}
        </div>
        <span className="small text-end" style={{width:45}}>{p[key]===null?"—":p[key]}</span>
       </div>)}
      </div>}
    </div>
   </section>;
  })}
 </div>;
}
