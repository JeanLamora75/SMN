import Link from "next/link";
import BootstrapIcon from "../../../bootstrap-icon";
import type {SprintPresence} from "@/lib/sprint-presence";
import type {TranslationKey} from "@/i18n/catalog";

type Text=(key:TranslationKey,params?:Readonly<Record<string,string|number>>)=>string;

/** The parent must NEVER fetch or pass the nominal data for role=user. */
export default function SprintCapacityPanel({data,canViewNames,t}:{
 data:SprintPresence|null;canViewNames:boolean;t:Text;
}){
 if(!canViewNames)return <section aria-label={t("sprintDetail.tabs.capacity")}>
  <h2 className="h5 mb-3">{t("sprintDetail.tabs.capacity")}</h2>
  <div className="alert alert-secondary" role="status">
   {t("sprintDetail.presenceRestricted")}
  </div>
 </section>;
 const fmt=(value:number|null)=>{
  if(value===null)return t("sprintDetail.presenceUnknown");
  return new Intl.NumberFormat(undefined,{maximumFractionDigits:4}).format(value)+" J/H";
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
    <div className="col-12 col-md-6">
     <div className="border rounded-3 p-3 h-100">
      <p className="small text-secondary mb-1">{t("sprintDetail.presenceTotal")}</p>
      <strong className="fs-4">{fmt(data.totalPresenceJh)}</strong>
     </div>
    </div>
    <div className="col-12 col-md-6">
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
       <th scope="col">{t("sprintDetail.presenceJh")}</th>
       <th scope="col">{t("sprintDetail.presenceDevelopmentJh")}</th>
       <th scope="col">{t("sprintDetail.presenceQuality")}</th>
      </tr></thead>
      <tbody>
       {data.members.map(member=><tr key={member.memberId}>
        <th scope="row" className="fw-medium">{member.displayName}</th>
        <td><strong>{fmt(member.presenceJh)}</strong></td>
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
   <p className="small text-secondary mb-0">{t("sprintDetail.presenceDistinction")}</p>
  </>}
 </section>;
}
