"use client";
import {useEffect,useRef} from "react";
import {useTranslation} from "@/i18n/client";

export type OfficeGenerationPhase="check"|"generate"|"download"|"save";
export type OfficeGenerationProgress={phase:OfficeGenerationPhase;percent:number|null};

export default function OfficeGenerationProgressModal({progress}:{progress:OfficeGenerationProgress|null}){
 const t=useTranslation();
 const tr=(key:string)=>t(("reportsCenter.officeProgress"+key) as Parameters<typeof t>[0]);
 const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!progress)return;
  const before=document.activeElement instanceof HTMLElement?document.activeElement:null;
  dialog.current?.focus();
  return()=>before?.focus();
 },[!!progress]); // focus only when modal opens/closes
 if(!progress)return null;
 const percent=progress.percent===null?null:Math.max(0,Math.min(100,Math.round(progress.percent)));
 return <div className="modal d-block" role="presentation" style={{backgroundColor:"rgba(0,0,0,.55)",zIndex:1100}}>
  <div className="modal-dialog modal-dialog-centered">
   <div className="modal-content" ref={dialog} role="dialog" aria-modal="true"
    aria-labelledby="smn-office-progress-title" aria-describedby="smn-office-progress-description"
    tabIndex={-1} onKeyDown={event=>{if(event.key==="Escape"||event.key==="Tab")event.preventDefault();}}>
    <div className="modal-header">
     <h2 className="modal-title h5" id="smn-office-progress-title">{tr("Title")}</h2>
    </div>
    <div className="modal-body">
     <p id="smn-office-progress-description" role="status" aria-live="polite">
      {tr(progress.phase==="check"?"Checking":progress.phase==="generate"?"Generating":progress.phase==="save"?"Saving":"Downloading")}
     </p>
     <div className="progress" style={{height:"1.25rem"}} aria-label={tr("Title")}>
      <div className={"progress-bar "+(percent===null?"progress-bar-striped progress-bar-animated":"")}
       role="progressbar" aria-valuemin={0} aria-valuemax={100}
       aria-valuenow={percent===null?undefined:percent}
       aria-valuetext={percent===null?tr("Indeterminate"):undefined}
       style={{width:percent===null?"100%":percent+"%"}}>
       {percent===null?tr("Working"):percent+" %"}
      </div>
     </div>
     <p className="text-secondary small mt-3 mb-0">{tr("PleaseWait")}</p>
    </div>
   </div>
  </div>
 </div>;
}
