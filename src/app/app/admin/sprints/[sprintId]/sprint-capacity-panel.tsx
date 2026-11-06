import Link from "next/link";
import BootstrapIcon from "../../../bootstrap-icon";
import {totalSprintDevelopmentJh,type SprintPresence,type PresenceMember,type PresenceMissingSource} from "@/lib/sprint-presence";
import type {TranslationKey} from "@/i18n/catalog";

type Text=(key:TranslationKey,params?:Readonly<Record<string,string|number>>)=>string;
const missingTranslation:Record<PresenceMissingSource,TranslationKey>={
 "no-assignments":"developmentCapacity.noAssignments",
 "ambiguous-assignment":"developmentCapacity.ambiguousAssignment",
 "assignment-version":"developmentCapacity.assignmentVersion",
 "work-calendar":"developmentCapacity.workCalendar",
 "exceptional-meeting-participants":"developmentCapacity.meetingParticipants",
 "exceptional-meeting-work-slots":"developmentCapacity.meetingWorkSlots"
};

/** The parent must NEVER fetch or pass the nominal data for role=user. */
export default function SprintCapacityPanel({data,canViewNames,teamId,locale,t}:{
 data:SprintPresence|null;canViewNames:boolean;teamId:string;locale:"fr"|"en";t:Text;
}){
 if(!canViewNames)return <section aria-label={t("sprintDetail.tabs.capacity")}>
  <h2 className="h5 mb-3">{t("sprintDetail.tabs.capacity")}</h2>
  <div className="alert alert-secondary" role="status">
   {t("sprintDetail.presenceRestricted")}
  </div>
 </section>;
 const roleLabels={
  scrumMaster:t("members.roles.scrumMaster"),
  productOwner:t("members.roles.productOwner"),
  developer:t("members.roles.developer")
 } as const;
 const roleNames=(values:readonly (keyof typeof roleLabels)[]|null|undefined)=>
  values?.length?values.map(value=>roleLabels[value]).join(", "):"—";
 const contribution=(values:readonly number[]|null|undefined)=>
  values?.length?values.map(value=>
   new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB").format(value)+" %"
  ).join(" → "):"—";
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
 const fmt=(value:number|null)=>{
  if(value===null)return t("sprintDetail.presenceUnknown");
  return new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{maximumFractionDigits:4}).format(value)+" J/H";
 };
 return <section aria-label={t("sprintDetail.tabs.capacity")}>
  <div className="d-flex align-items-center flex-wrap justify-content-between gap-2 mb-3">
   <h2 className="h5 mb-0">{t("sprintDetail.presenceTitle")}</h2>
   <Link className="btn btn-outline-secondary btn-sm" href="/app/admin/members">
    <BootstrapIcon name="people-fill"/> {t("sprintDetail.presenceManageMembers")}
   </Link>
  </div>
  <p className="small text-secondary">
   {t("sprintDetail.presenceMethod")}
  </p>
  <p className="small text-secondary">Le total de présence additionne les demi-journées disponibles de tous les membres affectés. La capacité de développement retient uniquement leur part de rôle Agile Développeur, pondérée par l’affectation et la contribution. Les calendriers doivent être effectifs aux dates du Sprint.</p>
  {!data||data.state==="unavailable"?<div className="alert alert-warning" role="status">
   {t(data?.state==="unavailable"&&data.reason==="history-missing"?
    "sprintDetail.presenceHistoryMissing":
    "sprintDetail.presenceUnavailable")}
  </div>:<>
   {data.source==="closure-snapshot"?
    <p className="small text-secondary">
     {t("sprintDetail.presenceSnapshot",{version:data.snapshotVersion??"?"})}
    </p>:
    <p className="small text-secondary">{t("sprintDetail.presenceForecast")}</p>}
   <div className="row g-3 mb-3">
    <div className="col-12 col-md-6 col-xl-4">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceTotal")}</p>
      <strong className="fs-4">{fmt(data.totalPresenceJh)}</strong>
     </div>
    </div>
    <div className="col-12 col-md-6 col-xl-4">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceDevelopmentTotal")}</p>
      <strong className="fs-4">{fmt(totalSprintDevelopmentJh(data.members))}</strong>
     </div>
    </div>
    <div className="col-12 col-md-6 col-xl-4">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceMembers")}</p>
      <strong className="fs-4">{data.members.length}</strong>
     </div>
    </div>
   </div>
   {data.members.length===0?
    <p className="text-secondary">{t("sprintDetail.presenceEmpty")}</p>:
    <div className="table-responsive">
     <table className="table align-middle">
      <thead><tr>
       <th scope="col">{t("sprintDetail.presenceMember")}</th>
       <th scope="col">{t("sprintDetail.presenceAgileRoles")}</th>
       <th scope="col">{t("sprintDetail.presenceFunction")}</th>
       <th scope="col">{t("sprintDetail.presenceContribution")}</th>
       <th scope="col">{t("sprintDetail.presenceJh")}</th>
       <th scope="col">{locale==="fr"?"Absences (J/H)":"Absences (person-days)"}</th>
       <th scope="col">{t("sprintDetail.presenceDevelopmentJh")}</th>
       <th scope="col">{t("sprintDetail.presenceQuality")}</th>
      </tr></thead>
      <tbody>
       {data.members.map(member=><tr key={member.memberId}>
        <th scope="row" className="fw-medium">{member.displayName}</th>
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
       </tr>)}
      </tbody>
     </table>
    </div>}
   {data.members.some(m=>m.missingSources?.length)&&
   <div className="alert alert-warning" role="status">
    <p className="mb-2">Certaines journées ne peuvent pas être calculées faute de données applicables aux dates du Sprint. Les chiffres manquants ne sont pas assimilés à zéro.</p>
    <ul className="mb-2">{data.members.filter(m=>m.missingSources?.length).map(m=>
     <li key={m.memberId}><strong>{m.displayName}</strong> :{" "}
      {m.missingSources!.map(code=>t(missingTranslation[code])).join("; ")}{m.missingSources!.includes("work-calendar")?<span> — trame hebdomadaire absente ou sans version en vigueur pendant le Sprint. <Link href={"/app/admin/members/"+encodeURIComponent(m.memberId)+"?"+new URLSearchParams({teamId})}>Ouvrir la fiche et vérifier le calendrier</Link></span>:null}</li>)}
    </ul>
    <Link href="/app/admin/development-capacity">{t("sprintDetail.presenceSeeDiagnosis")}</Link>
   </div>}
  <p className="small text-secondary mb-0">{t("sprintDetail.presenceDistinction")}</p>
  </>}
 </section>;
}
