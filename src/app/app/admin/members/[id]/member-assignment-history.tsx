"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import type {AssignmentVersion} from "@/server/members/assignment";

type HistoryResponse={memberId:string;versions:AssignmentVersion[]};

/** Lecture seule : l'historique de l'affectation appartient à l'onglet, pas à la modale. */
export default function MemberAssignmentHistory({memberId}:{memberId:string}){
 const t=useTranslation();
 const [versions,setVersions]=useState<AssignmentVersion[]|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  let active=true;
  setVersions(null);setError(false);
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/assignment",{cache:"no-store"})
   .then(async response=>{
    if(!response.ok)throw Error("assignment-history-unavailable");
    return response.json() as Promise<HistoryResponse>;
   })
   .then(data=>{
    if(!active)return;
    if(data.memberId!==memberId||!Array.isArray(data.versions))
     throw Error("assignment-history-invalid");
    setVersions(data.versions);
   })
   .catch(()=>{if(active)setError(true);});
  return()=>{active=false;};
 },[memberId]);
 return <div className="mt-4 pt-3 border-top">
  <h3 className="h6">{t("members.assignment.history")}</h3>
  {error&&<p role="alert" className="alert alert-warning">{t("members.assignment.loadFailed")}</p>}
  {!error&&versions===null&&<p role="status">{t("members.assignment.loading")}</p>}
  {!error&&versions?.length===0&&<p>{t("members.assignment.empty")}</p>}
  {!error&&versions&&versions.length>0&&<>
   <div className="table-responsive">
    <table className="table table-sm align-middle">
     <thead><tr>
      <th scope="col">{t("members.assignment.version")}</th>
      <th scope="col">{t("members.assignment.effectiveFrom")}</th>
      <th scope="col">{t("members.assignment.contract")}</th>
      <th scope="col">{t("members.assignment.allocation")}</th>
      <th scope="col">{t("members.assignment.contribution")}</th>
      <th scope="col">{t("members.assignment.sharesTitle")}</th>
     </tr></thead>
     <tbody>{versions.map(v=><tr key={v.revision}>
      <td>{v.revision}</td>
      <td><time dateTime={v.effectiveFrom}>{v.effectiveFrom}</time></td>
      <td>{v.contractPercent}%</td>
      <td>{v.allocationPercent}%</td>
      <td>{v.contributionPercent}%</td>
      <td>{t("members.assignment.shareSummary",{
       sm:v.shares.scrumMaster,po:v.shares.productOwner,dev:v.shares.developer
      })}</td>
     </tr>)}</tbody>
    </table>
   </div>
   <p className="small text-secondary mb-0">{t("members.assignment.historyNote")}</p>
  </>}
 </div>;
}
