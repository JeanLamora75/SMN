import Link from "next/link";
import BootstrapIcon from "../../../bootstrap-icon";
import {totalSprintDevelopmentJh,type SprintPresence,type PresenceMissingSource} from "@/lib/sprint-presence";
import SprintCapacityMemberTable from "./sprint-capacity-member-table";
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
  <p className="small text-secondary">{t("sprintDetail.presenceRoleMethod")}</p>
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
   <div className="row row-cols-1 row-cols-md-2 row-cols-xl-5 g-3 mb-3">
    <div className="col">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceTotal")}</p>
      <strong className="fs-4">{fmt(data.totalPresenceJh)}</strong>
     </div>
    </div>
    <div className="col">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceDevelopmentTotal")}</p>
      <strong className="fs-4">{fmt(totalSprintDevelopmentJh(data.members))}</strong>
     </div>
    </div>
    <div className="col">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceProductOwnerTotal")}</p>
      <strong className="fs-4">{fmt(data.roleCapacityJh?.productOwner??null)}</strong>
     </div>
    </div>
    <div className="col">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceScrumMasterTotal")}</p>
      <strong className="fs-4">{fmt(data.roleCapacityJh?.scrumMaster??null)}</strong>
     </div>
    </div>
    <div className="col">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceMembers")}</p>
      <strong className="fs-4">{data.members.length}</strong>
     </div>
    </div>
   </div>
   {data.members.length===0?
    <p className="text-secondary">{t("sprintDetail.presenceEmpty")}</p>:
    <SprintCapacityMemberTable members={data.members} locale={locale}/> }
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
