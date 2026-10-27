"use client";
import {useEffect,useState} from "react";
type Cycle={id:string;name:string;status:string};
export default function TeamCycleList({teamId,mode}:{teamId:string;mode:"scrum"|"kanban"}){
 const [items,setItems]=useState<Cycle[]>([]);
 const [error,setError]=useState(false);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/team-cycles/list?"+new URLSearchParams({teamId}),{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error();return response.json();})
   .then((value:{teamId:string;mode:string;items:Cycle[]})=>{
    if(controller.signal.aborted)return;
    if(value.teamId!==teamId||value.mode!==mode||!Array.isArray(value.items))throw Error();
    setItems(value.items);setError(false);setLoading(false);
   }).catch(()=>{if(!controller.signal.aborted){setError(true);setLoading(false);}});
  return()=>controller.abort();
 },[teamId,mode]);
 return <section className="smn-panel rounded-4 p-4 mt-4">
  <h2 className="h5">{mode==="scrum"?"Sprints":"Périodes Kanban"} de l'équipe</h2>
  {loading?<p role="status">Chargement…</p>:error?<p role="alert">Liste indisponible.</p>:
   items.length===0?<p>Aucun cycle.</p>:
   <ul className="list-group">{items.map(item=><li key={item.id} className="list-group-item">
    <strong>{item.name}</strong> · {item.status}
   </li>)}</ul>}
 </section>;
}
