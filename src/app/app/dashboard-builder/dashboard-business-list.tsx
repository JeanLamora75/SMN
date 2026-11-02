"use client";
import Link from "next/link";
import type {DashboardListPayload} from "@/server/dashboard-builder/lists";
export function DashboardBusinessList({data,onNext,onPrevious,page=0}:{
 data:DashboardListPayload;onNext:()=>void;onPrevious:()=>void;page?:number;
}){
 if(!data.rows.length)return <p role="status" className="text-body-secondary">Aucun résultat</p>;
 return <div>
  <div className="table-responsive"><table className="table table-sm align-middle">
   <thead><tr><th scope="col">Fiche</th><th scope="col">Type</th><th scope="col">Statut</th><th scope="col">Date</th></tr></thead>
   <tbody>{data.rows.map(item=><tr key={item.id}><th scope="row">
    <Link href={item.href} className="text-decoration-none">{item.label}</Link></th>
    <td>{item.kind}</td><td>{item.status}</td><td>{item.date??"—"}</td></tr>)}</tbody>
  </table></div>
  <nav className="d-flex align-items-center justify-content-between" aria-label="Pagination des fiches">
   <span className="small text-body-secondary">{data.total} résultat(s) · Page {page+1}</span>
   <div className="d-flex gap-2">
    <button className="btn btn-outline-secondary btn-sm" type="button" disabled={page===0} onClick={onPrevious}>Précédent</button>
    <button className="btn btn-outline-secondary btn-sm" type="button" disabled={data.nextOffset===null} onClick={onNext}>Suivant</button>
   </div>
  </nav>
 </div>;
}
