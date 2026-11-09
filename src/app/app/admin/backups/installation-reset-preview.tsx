"use client";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";

type ResetImpact={
 inspectedAt:string;
 installation:{id:string;schemaVersion:number;createdAt:string;postgresVersion:string};
 database:{tables:number;estimatedRows:number;
  examples:{table:string;estimatedRows:number}[];estimatesOnly:true};
 privateDocuments:{count:number|null;state:"verified"|"unavailable"};
 backups:{count:number|null;lastSuccessfulAt:string|null;state:"available"|"unavailable"};
 risks:string[];confirmationRequired:string;canExecute:false;blocked:true;
};
export default function InstallationResetPreview(){
 const t=useTranslation();
 const [impact,setImpact]=useState<ResetImpact|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 async function inspect(){
  if(loading)return;
  setLoading(true);setError("");setImpact(null);
  try{
   const response=await fetch("/api/admin/installation/reset",{cache:"no-store"});
   if(!response.ok)throw Error("unavailable");
   const data=await response.json() as ResetImpact;
   if(data.canExecute!==false||data.blocked!==true||
    !Array.isArray(data.risks)||!Array.isArray(data.database?.examples))
    throw Error("invalid-impact");
   setImpact(data);
  }catch{setError(t("installationReset.failed"));}
  finally{setLoading(false);}
 }
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="installation-reset-title">
  <div>
   <h2 className="h5" id="installation-reset-title">{t("installationReset.title")}</h2>
   <p className="small text-secondary mb-0">{t("installationReset.intro")}</p>
  </div>
  <button className="btn btn-outline-warning align-self-start" type="button"
   disabled={loading} onClick={inspect}>
   {loading?t("installationReset.inspecting"):t("installationReset.inspect")}
  </button>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {impact&&<div className="d-grid gap-3">
   <p className="alert alert-warning mb-0" role="status">{t("installationReset.blocked")}</p>
   <dl className="row small">
    <dt className="col-sm-5">{t("installationReset.schema")}</dt>
    <dd className="col-sm-7">{impact.installation.schemaVersion}</dd>
    <dt className="col-sm-5">{t("installationReset.tables")}</dt>
    <dd className="col-sm-7">{impact.database.tables}</dd>
    <dt className="col-sm-5">{t("installationReset.estimatedRows")}</dt>
    <dd className="col-sm-7">{impact.database.estimatedRows.toLocaleString()}</dd>
    <dt className="col-sm-5">{t("installationReset.documents")}</dt>
    <dd className="col-sm-7">{impact.privateDocuments.count??t("installationReset.unknown")}</dd>
    <dt className="col-sm-5">{t("installationReset.backups")}</dt>
    <dd className="col-sm-7">{impact.backups.count??t("installationReset.unknown")}</dd>
   </dl>
   <p className="small text-secondary">{t("installationReset.estimatesWarning")}</p>
   <details>
    <summary>{t("installationReset.tableDetails")}</summary>
    <div className="table-responsive mt-2"><table className="table table-sm small">
     <thead><tr><th scope="col">{t("installationReset.table")}</th>
      <th scope="col">{t("installationReset.estimatedRows")}</th></tr></thead>
     <tbody>{impact.database.examples.map(item=><tr key={item.table}>
      <td><code>{item.table}</code></td><td>{item.estimatedRows.toLocaleString()}</td>
     </tr>)}</tbody>
    </table></div>
   </details>
   <div className="alert alert-secondary mb-0">
    <strong>{t("installationReset.risksTitle")}</strong>
    <ul className="mb-0">{impact.risks.map(risk=><li key={risk}>
     {t("installationReset.risks."+risk)}
    </li>)}</ul>
   </div>
   <p className="small text-secondary mb-0">{t("installationReset.backupAdvice")}</p>
   <button type="button" className="btn btn-outline-secondary align-self-start"
    onClick={()=>setImpact(null)}>{t("installationReset.close")}</button>
  </div>}
 </section>;
}
