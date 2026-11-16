"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {useLocale,useTranslation} from "@/i18n/client";
import {
 HELP_SETUP_STORAGE_KEY,helpSetupDoneCount,parseHelpSetupProgress,
 serializeHelpSetupProgress,type HelpSetupProgress,type HelpSetupStatus,type HelpSetupStep
} from "@/lib/help-setup";
import {helpSetupCopy} from "./help-setup-copy";
import BootstrapIcon from "../bootstrap-icon";

export default function HelpSetupChecklist({steps}:{steps:readonly HelpSetupStep[]}){
 const locale=useLocale();
 const t=useTranslation();
 const copy=helpSetupCopy[locale==="en"?"en":"fr"];
 const [progress,setProgress]=useState<HelpSetupProgress>({});
 const [loaded,setLoaded]=useState(false);
 const [error,setError]=useState(false);
 useEffect(()=>{
  // Storage hydration runs after the effect, avoiding synchronous cascaded renders.
  let active=true;
  queueMicrotask(()=>{
   if(!active)return;
   try{
    const saved=window.localStorage.getItem(HELP_SETUP_STORAGE_KEY);
    setProgress(parseHelpSetupProgress(saved));
   }catch{setError(true);}
   setLoaded(true);
  });
  return ()=>{active=false;};
 },[]);

 function change(id:HelpSetupStep["id"],status:HelpSetupStatus){
  if(!loaded)return;
  const next={...progress,[id]:status};
  try{
   window.localStorage.setItem(HELP_SETUP_STORAGE_KEY,serializeHelpSetupProgress(next));
   setProgress(next);
   setError(false);
  }catch{
   setError(true);
  }
 }
 return <section className="smn-panel rounded-4 p-4 smn-help-onboarding" aria-labelledby="smn-help-setup-heading">
  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
   <h2 className="h5 mb-0" id="smn-help-setup-heading">{t("helpCenter.firstSetup")}</h2>
   <span className="small fw-semibold" role="status" aria-live="polite">
    {loaded?copy.count(helpSetupDoneCount(progress,steps),steps.length):copy.loading}
   </span>
  </div>
  <p className="text-secondary small">{copy.notice}</p>
  <p className="small">{copy.localNotice}</p>
  {error&&<p role="alert" className="alert alert-warning">{copy.storageError}</p>}
  {loaded&&<ol className="smn-help-setup-list">
   {steps.map(step=>{
    const status=progress[step.id]??"todo";
    const meta=copy.steps[step.id];
    return <li key={step.id} className="smn-help-setup-step">
     <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
      <div>
       <h3 className="h6 mb-1">{meta.title}</h3>
       <p className="mb-1">{meta.purpose}</p>
       <p className="small text-secondary mb-2"><strong>{copy.prerequisite} :</strong> {meta.prerequisite}</p>
      </div>
      <span className="badge text-bg-secondary">{copy.statuses[status]}</span>
     </div>
     <div className="d-flex flex-wrap align-items-center gap-2">
      <Link href={step.route} className="btn btn-sm btn-outline-secondary">
       <BootstrapIcon name="arrow-right"/> {copy.openScreen}
      </Link>
      <Link href={"/app/help?article="+encodeURIComponent(step.articleId)}
       className="btn btn-sm btn-outline-secondary">{copy.guide}</Link>
      {status!=="todo"&&<button type="button" className="btn btn-sm btn-outline-secondary"
       onClick={()=>change(step.id,"todo")}>{copy.statuses.todo}</button>}
      {status!=="in_progress"&&<button type="button" className="btn btn-sm btn-outline-primary"
       onClick={()=>change(step.id,"in_progress")}>
       {status==="done"?copy.resume:copy.start}
      </button>}
      {status!=="done"&&<button type="button" className="btn btn-sm btn-primary"
       onClick={()=>change(step.id,"done")}>{copy.finish}</button>}
     </div>
    </li>;
   })}
  </ol>}
 </section>;
}
