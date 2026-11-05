"use client";
import Link from "next/link";
import {SMNIcon} from "../smn-icon";
import {isDashboardIcon} from "@/lib/dashboard-builder/icon-catalog";
import {ceremonyIconColorHex} from "@/lib/ceremony-appearance";
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
const ceremonyKinds=new Set(["ceremony","template","exceptional"]);
/** Use the saved pictogram first; legacy Scrum ceremonies fall back to calendar icons. */
function ceremonyIcon(kind:string,label:string,configured:unknown):string|null{
 if(isDashboardIcon(configured))return configured;
 if(!ceremonyKinds.has(kind))return null;
 const normalized=label.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(/planning|planification/.test(normalized))return "calendar-event";
 if(/daily|melee quotidienne|quotidien/.test(normalized))return "calendar-check";
 if(/review|revue/.test(normalized))return "bullseye";
 if(/retro/.test(normalized))return "chat-dots";
 if(/refinement|affinage/.test(normalized))return "sliders";
 return "calendar3";
}
const ceremonyStatusLabels:Record<string,{fr:string;en:string}>={
 scheduled:{fr:"Planifiée",en:"Scheduled"},
 held:{fr:"Tenue",en:"Held"},
 not_held:{fr:"Non tenue",en:"Not held"},
 cancelled:{fr:"Annulée",en:"Cancelled"},
 unknown:{fr:"Statut inconnu",en:"Unknown"},
};
function statusLabel(kind:string,status:string,locale:string):string{
 if(!ceremonyKinds.has(kind))return statusNames[status]??status;
 const normalized=status.toLowerCase();
 const canonical=["done","completed","occurred","effective","realized"].includes(normalized)?"held":
  ["planned"].includes(normalized)?"scheduled":
  normalized==="canceled"?"cancelled":normalized;
 const labels=ceremonyStatusLabels[canonical];
 return labels?(locale.toLowerCase().startsWith("fr")?labels.fr:labels.en):status;
}
export function DashboardBusinessList({data,columns,locale="fr"}:{
 data:DashboardListPayload;columns?:readonly string[];locale?:string;
}){
 const formatDate=(raw:string)=>{
  const onlyDate=/^\d{4}-\d{2}-\d{2}$/.test(raw);
  const date=new Date(onlyDate?raw+"T12:00:00Z":raw);
  if(Number.isNaN(date.getTime()))return raw;
  return new Intl.DateTimeFormat(locale.startsWith("fr")?"fr-FR":"en-GB",{
   day:"2-digit",month:"short",year:"numeric",...(!onlyDate?{hour:"2-digit" as const,minute:"2-digit" as const,timeZone:"Europe/Paris"}:{timeZone:"UTC"})
  }).format(date);
 };
 const visible=new Set(columns??["label","kind","status","date"]);
 if(!data.rows.length)return <p role="status" className="text-body-secondary mb-0">Aucun résultat</p>;
 return <div>
  <ul className={styles.businessList}>{data.rows.map(item=><li className={styles.businessItem} key={item.id}>
   <div className={styles.businessItemTop}>
    <Link href={item.href} className={styles.businessItemTitle}>{ceremonyIcon(item.kind,item.label,item.icon)&&<span className="me-2" style={{color:ceremonyIconColorHex(item.iconColor)??"inherit"}}><SMNIcon name={ceremonyIcon(item.kind,item.label,item.icon)!}/></span>}{item.label}</Link>
    {visible.has("status")&&item.status&&<span className={styles.businessBadge}>{statusLabel(item.kind,item.status,locale)}</span>}
   </div>
   {(visible.has("kind")||visible.has("date"))&&<span className={styles.businessItemMeta}>
    {visible.has("kind")?(typeNames[item.kind]??item.kind):""}{visible.has("kind")&&visible.has("date")&&item.date?" · ":""}{visible.has("date")?(item.date?formatDate(item.date):""):""}
   </span>}
  </li>)}</ul>
  <p className="small text-body-secondary mt-3 mb-0">{data.rows.length<data.total?`${data.rows.length} sur ${data.total} résultat(s)`:`${data.total} résultat(s)`}</p>
 </div>;
}
