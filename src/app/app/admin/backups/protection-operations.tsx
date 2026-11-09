import type {TranslationKey} from "@/i18n/catalog";
"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Item={
 kind:"backup"|"retention-cleanup"|"restore"|"installation-reset";
 operationId:string;startedAt:string;checkedAt:string;
 status:"running"|"succeeded"|"failed"|"cancelled"|"interrupted"|"partial"|"blocked";
 reason:string;recovery:string;processed:number;unprocessed:number;failed:number;
 measuredRpoMinutes:null;measuredRtoMinutes:null;
 indicativeRpoHours:24;indicativeRtoMinutes:60;targetsValidated:false;
};
export default function ProtectionOperations(){
 const t=useTranslation();
 const [items,setItems]=useState<Item[]|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState(false);
 async function load(){
  if(loading)return;
  setLoading(true);setError(false);
  try{
   const response=await fetch("/api/admin/backups/operations",{cache:"no-store"});
   if(!response.ok)throw Error("unavailable");
   const data=await response.json() as {operations:Item[]};
   if(!Array.isArray(data.operations)||data.operations.some(x=>
    typeof x.reason!=="string"||typeof x.status!=="string"||
    x.targetsValidated!==false))throw Error("invalid");
   setItems(data.operations);
  }catch{setError(true);}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="protection-operations-title">
  <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
   <div>
    <h2 className="h5" id="protection-operations-title">{t("protectionOperations.title")}</h2>
    <p className="small text-secondary mb-0">{t("protectionOperations.intro")}</p>
   </div>
   <button type="button" className="btn btn-outline-primary btn-sm"
    disabled={loading} onClick={()=>void load()}>{loading?t("protectionOperations.loading"):
     t("protectionOperations.refresh")}</button>
  </div>
  {error&&<p role="alert" className="alert alert-warning">
   {t("protectionOperations.unavailable")}</p>}
  <div className="d-grid gap-2">
   {items?.map(item=><article key={item.kind+"-"+item.operationId}
    className="border rounded p-3 d-grid gap-2">
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
     <strong>{t(("protectionOperations.kinds."+item.kind) as TranslationKey)}</strong>
     <span className={"badge "+(item.status==="succeeded"?"text-bg-success":
      item.status==="running"?"text-bg-info":"text-bg-warning")}>
      {t(("protectionOperations.statuses."+item.status) as TranslationKey)}
     </span>
    </div>
    <p className="small mb-0">{t(("protectionOperations.reasons."+item.reason) as TranslationKey)}</p>
    <p className="small text-secondary mb-0">
     {t(("protectionOperations.recoveries."+item.recovery) as TranslationKey)}</p>
    {item.kind==="retention-cleanup"&&<p className="small mb-0">
     {t("protectionOperations.counts",{done:item.processed,
      pending:item.unprocessed,failed:item.failed})}</p>}
   </article>)}
  </div>
  <p className="small text-secondary mb-0">{t("protectionOperations.objectives")}</p>
 </section>;
}
