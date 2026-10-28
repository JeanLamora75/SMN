"use client";
import {useEffect,useState} from "react";
type Mode="scrum"|"kanban";
type Cycle={id:string;name:string;status:string};
type Listing={teamId:string;mode:Mode;items:Cycle[];page?:number;totalPages?:number;total?:number};
export default function TeamCycleList({teamId,mode}:{teamId:string;mode:Mode}){
 const [items,setItems]=useState<Cycle[]>([]);
 const [error,setError]=useState(false);
 const [loadedKey,setLoadedKey]=useState<string|null>(null);
 const [page,setPage]=useState(1);
 const [search,setSearch]=useState("");
 const [status,setStatus]=useState("all");
 const [sort,setSort]=useState<"priority"|"newest"|"oldest">("priority");
 const [totalPages,setTotalPages]=useState(1);
 const [total,setTotal]=useState(0);
 const requestKey=JSON.stringify([teamId,mode,page,search,status,sort]);
 const loading=loadedKey!==requestKey;
 useEffect(()=>{
  const controller=new AbortController();
  const params=new URLSearchParams({teamId});
  if(mode==="scrum"){
   params.set("page",String(page));
   params.set("pageSize","25");
   params.set("search",search);
   params.set("status",status);
   params.set("sort",sort);
  }
  void fetch("/api/admin/team-cycles/list?"+params.toString(),{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error();return response.json() as Promise<Listing>;})
   .then(value=>{
    if(controller.signal.aborted)return;
    if(value.teamId!==teamId||value.mode!==mode||!Array.isArray(value.items))throw Error();
    setItems(value.items);
    setTotalPages(value.totalPages??1);
    setTotal(value.total??value.items.length);
    setError(false);setLoadedKey(requestKey);
   }).catch(()=>{if(!controller.signal.aborted){setError(true);setLoadedKey(requestKey);}});
  return()=>controller.abort();
 },[teamId,mode,page,search,status,sort,requestKey]);
 return <section className="smn-panel rounded-4 p-4 mt-4">
  <h2 className="h5">{mode==="scrum"?"Sprints":"Périodes Kanban"} de l&apos;équipe</h2>
  {mode==="scrum"&&<div className="row g-2 mb-3">
   <div className="col-12 col-md-5"><label htmlFor="team-cycles-search" className="form-label">Rechercher</label>
    <input id="team-cycles-search" className="form-control" maxLength={100} value={search}
     onChange={e=>{setPage(1);setSearch(e.target.value);}}/></div>
   <div className="col-6 col-md-3"><label htmlFor="team-cycles-status" className="form-label">Statut</label>
    <select id="team-cycles-status" className="form-select" value={status}
     onChange={e=>{setPage(1);setStatus(e.target.value);}}>
     <option value="all">Tous</option><option value="planned">Planifié</option>
     <option value="active">Actif</option><option value="finished">Terminé</option>
     <option value="closed">Clôturé</option><option value="suspended">Suspendu</option>
    </select></div>
   <div className="col-6 col-md-4"><label htmlFor="team-cycles-sort" className="form-label">Tri</label>
    <select id="team-cycles-sort" className="form-select" value={sort}
     onChange={e=>{setPage(1);setSort(e.target.value as "priority"|"newest"|"oldest");}}>
     <option value="priority">Priorité</option><option value="newest">Plus récents</option>
     <option value="oldest">Plus anciens</option></select></div>
  </div>}
  {loading?<p role="status">Chargement…</p>:error?<p role="alert">Liste indisponible.</p>:
   items.length===0?<p>Aucun cycle.</p>:
   <ul className="list-group">{items.map(item=><li key={item.id} className="list-group-item">
    <strong>{item.name}</strong> · {item.status}
   </li>)}</ul>}
  {mode==="scrum"&&!error&&<div className="d-flex gap-2 align-items-center mt-3">
   <button type="button" className="btn btn-outline-secondary btn-sm" disabled={loading||page<=1}
    onClick={()=>setPage(v=>v-1)}>Précédent</button>
   <span className="small">Page {page} / {totalPages} · {total} sprint(s)</span>
   <button type="button" className="btn btn-outline-secondary btn-sm"
    disabled={loading||page>=totalPages} onClick={()=>setPage(v=>v+1)}>Suivant</button>
  </div>}
 </section>;
}
