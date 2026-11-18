"use client";

import {useState} from "react";
import type {PresenceMember} from "@/lib/sprint-presence";
import {useTranslation} from "@/i18n/client";
import CountryFlag from "../../members/country-flag";
import {nextCapacitySort,sortCapacityMembers,type CapacitySort,type CapacitySortKey} from "./sprint-capacity-sort";

export default function SprintCapacityMemberTable({members,locale}:{members:readonly PresenceMember[];locale:"fr"|"en"}){
 const t=useTranslation();
 const [sort,setSort]=useState<CapacitySort|null>(null);
 const roleLabels={
  scrumMaster:t("members.roles.scrumMaster"),
  productOwner:t("members.roles.productOwner"),
  developer:t("members.roles.developer")
 } as const;
 const roleNames=(values:PresenceMember["agileRoles"])=>
  values?.length?values.map(value=>roleLabels[value]).join(", "):"—";
 const contribution=(values:PresenceMember["contributionPercents"])=>
  values?.length?values.map(value=>
   new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB").format(value)+" %"
  ).join(" → "):"—";
 const fmt=(value:number|null|undefined)=>{
  if(value==null)return t("sprintDetail.presenceUnknown");
  return new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{maximumFractionDigits:4}).format(value)+" J/H";
 };
 const absenceTooltip=(member:PresenceMember)=>{
  const fr=locale==="fr";
  if(member.absenceJh===undefined||member.absenceJh===null)
   return fr?"Détail des absences non disponible":"Absence details unavailable";
  if(!member.absences?.length)return fr?"Aucune absence décomptée pendant ce sprint":"No counted absences during this sprint";
  const formatDate=(date:string)=>new Intl.DateTimeFormat(fr?"fr-FR":"en-GB",{
   timeZone:"UTC",day:"2-digit",month:"short",year:"numeric"
  }).format(new Date(date+"T12:00:00Z"));
  return member.absences.map(item=>{
   const duration=item.halfDays===2?(fr?"1 jour":"1 day"):(fr?"0,5 jour":"0.5 day");
   const nature=fr?(item.isPlanned?"Planifiée":"Imprévue"):(item.isPlanned?"Planned":"Unplanned");
   return [formatDate(item.date),duration,item.category||nature,nature,item.reason].filter(Boolean).join(" · ");
  }).join("\n");
 };
 const heading=(key:CapacitySortKey,label:string)=><th scope="col"
  aria-sort={sort?.key===key?(sort.direction==="desc"?"descending":"ascending"):"none"}>
  <button type="button" className="smn-capacity-sort-button"
   onClick={()=>setSort(previous=>nextCapacitySort(previous,key))}
   title={t(sort?.key===key&&sort.direction==="desc"?
    "indicators.reporting.sortAscending":"indicators.reporting.sortDescending")}>
   <span className="smn-capacity-sort-arrow" aria-hidden="true">{sort?.key===key?(sort.direction==="desc"?"↓":"↑"):""}</span>
   <span>{label}</span>
  </button>
 </th>;
 return <div className="table-responsive">
  <table className="table align-middle smn-capacity-member-table">
   <thead><tr>
    {heading("name",t("sprintDetail.presenceMember"))}
    {heading("roles",t("sprintDetail.presenceAgileRoles"))}
    {heading("function",t("sprintDetail.presenceFunction"))}
    {heading("contribution",t("sprintDetail.presenceContribution"))}
    {heading("presence",t("sprintDetail.presenceJh"))}
    {heading("absence",locale==="fr"?"Absences (J/H)":"Absences (person-days)")}
    {heading("development",t("sprintDetail.presenceDevelopmentJh"))}
    {heading("quality",t("sprintDetail.presenceQuality"))}
   </tr></thead>
   <tbody>{sortCapacityMembers(members,sort).map(member=><tr key={member.memberId}>
    <th scope="row" className="fw-medium"><span className="smn-capacity-member-identity"><CountryFlag countryIso2={member.countryIso2} tableSize/><span>{member.displayName}</span></span></th>
    <td>{roleNames(member.agileRoles)}</td>
    <td>{member.professionalFunction?.trim()||"—"}</td>
    <td>{contribution(member.contributionPercents)}</td>
    <td><strong>{fmt(member.presenceJh)}</strong></td>
    <td tabIndex={0} title={absenceTooltip(member)}
     aria-label={(locale==="fr"?"Absences : ":"Absences: ")+
      fmt(member.absenceJh??null)+". "+absenceTooltip(member)}
     className="text-decoration-underline"
     style={{textDecorationStyle:"dotted",textUnderlineOffset:"3px",cursor:"help"}}>
      {fmt(member.absenceJh??null)}
    </td>
    <td className="text-secondary">{fmt(member.developmentJh)}</td>
    <td>{member.unknownDays>0?
     <span className="badge text-bg-warning">
      {t("sprintDetail.presenceUnknownDays",{count:member.unknownDays})}
     </span>:
     <span className="badge text-bg-light">{t("sprintDetail.presenceComplete")}</span>}
    </td>
   </tr>)}</tbody>
  </table>
 </div>;
}
