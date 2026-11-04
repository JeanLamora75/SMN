"use client";
import Link from "next/link";
import type {DashboardListPayload} from "@/server/dashboard-builder/lists";
import styles from "./dashboard-dimensions.module.css";

const typeNames:Record<string,string>={
 risk:"Risque",obstacle:"Obstacle",dependency:"Dépendance",highlight:"Événement",
 decision:"Décision",action:"Action",ceremony:"Cérémonie",exceptional:"Événement",
 note:"Note",alert:"Alerte",template:"Cérémonie",
};
const statusNames:Record<string,string>={
 open:"Ouvert",in_progress:"En cours",resolved:"Résolu",abandoned:"Abandonné",
 closed:"Clôturé",completed:"Terminé",satisfied:"Satisfaite",cancelled:"Annulé",
 planned:"Planifié",active:"Actif",blocked:"Bloquant",pending:"En attente",
};
export function DashboardBusinessList({data,onNext,onPrevious,page=0,columns}:{
 data:DashboardListPayload;onNext:()=>void;onPrevious:()=>void;page?:number;columns?:readonly string[];
}){
 const visible=new Set(columns??["label","kind","status","date"]);
 if(!data.rows.length)return <p role="status" className="text-body-secondary mb-0">Aucun résultat</p>;
 return <div>
  <ul className={styles.businessList}>{data.rows.map(item=><li className={styles.businessItem} key={item.id}>
   <div className={styles.businessItemTop}>
    <Link href={item.href} className={styles.businessItemTitle}>{item.label}</Link>
    {visible.has("status")&&item.status&&<span className={styles.businessBadge}>{statusNames[item.status]??item.status}</span>}
   </div>
   {(visible.has("kind")||visible.has("date"))&&<span className={styles.businessItemMeta}>
    {visible.has("kind")?(typeNames[item.kind]??item.kind):""}{visible.has("kind")&&visible.has("date")&&item.date?" · ":""}{visible.has("date")?(item.date??""):""}
   </span>}
  </li>)}</ul>
  <nav className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3" aria-label="Pagination des fiches">
   <span className="small text-body-secondary">{data.total} résultat(s) · Page {page+1}</span>
   <div className="d-flex gap-2">
    <button className="btn btn-outline-secondary btn-sm" type="button" disabled={page===0} onClick={onPrevious}>Précédent</button>
    <button className="btn btn-outline-secondary btn-sm" type="button" disabled={data.nextOffset===null} onClick={onNext}>Suivant</button>
   </div>
  </nav>
 </div>;
}
