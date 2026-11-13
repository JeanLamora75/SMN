"use client";

import {useEffect,useRef,useState} from "react";
import BootstrapIcon from "../bootstrap-icon";
import {useTicketsCycle} from "../tickets-cycle-context";
import {useLocale,useTranslation} from "@/i18n/client";

type Snapshot={
 snapshotId:string;businessDate:string;importedAt:string;
 originalFilename:string;rowCount:number;csvBytes?:number;
};
type FilesResponse={snapshots:Snapshot[];closed:boolean;error?:string};
type UiState="loading"|"ready"|"error";
const fmtSize=(bytes:number|undefined,locale:string):string=>{
 if(typeof bytes!=="number"||!Number.isFinite(bytes))return "—";
 return new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(bytes<1024?bytes:bytes/1024)+(bytes<1024?" B":" KiB");
};

export default function TicketsFiles(){
 const t=useTranslation(),locale=useLocale(),context=useTicketsCycle();
 const {teamId,cycleId,mode,role,cycleName,cycleStatus,state:cycleState}=context;
 const [items,setItems]=useState<Snapshot[]>([]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [state,setState]=useState<UiState>("loading");
 const [closed,setClosed]=useState(false);
 const [version,setVersion]=useState(0);
 const [feedback,setFeedback]=useState<"error"|"deleted"|null>(null);
 const [target,setTarget]=useState<Snapshot|null>(null);
 const [deleting,setDeleting]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const previous=useRef("");
 const localeCode=locale==="en"?"en-GB":"fr-FR";
 const dateLabel=(date:string)=>new Intl.DateTimeFormat(localeCode,{timeZone:"UTC",day:"2-digit",month:"long",year:"numeric"}).format(new Date(date+"T00:00:00Z"));
 const importLabel=(date:string)=>new Intl.DateTimeFormat(localeCode,{dateStyle:"medium",timeStyle:"short"}).format(new Date(date));
 const key=teamId&&cycleId&&mode?teamId+"|"+mode+"|"+cycleId:"";
 useEffect(()=>{
  const ctrl=new AbortController();
  // Never retain a selected file when switching the team or the cycle.
  if(previous.current!==key){
   previous.current=key;
   if(dialog.current?.open)dialog.current.close();
   queueMicrotask(()=>{if(!ctrl.signal.aborted){setItems([]);setSelectedId(null);setTarget(null);setFeedback(null);}});
  }
  if(!key||cycleState!=="ready"||!teamId||!cycleId||!mode){
   queueMicrotask(()=>{if(!ctrl.signal.aborted)setState("ready");});
   return ()=>ctrl.abort();
  }
  queueMicrotask(()=>{if(!ctrl.signal.aborted)setState("loading");});
  const url="/api/admin/tickets/snapshots?"+new URLSearchParams({teamId,cycleId,mode}).toString();
  void fetch(url,{signal:ctrl.signal,cache:"no-store"})
   .then(async response=>{
    if(!response.ok)throw Error("snapshots-unavailable");
    return response.json() as Promise<FilesResponse>;
   }).then(result=>{
    if(ctrl.signal.aborted)return;
    if(!Array.isArray(result.snapshots))throw Error("invalid-snapshots");
    setItems(result.snapshots);
    setClosed(result.closed===true);
    setSelectedId(old=>result.snapshots.some(item=>item.snapshotId===old)?
      old:result.snapshots[0]?.snapshotId??null);
    setState("ready");
   }).catch(()=>{if(!ctrl.signal.aborted){setItems([]);setSelectedId(null);setState("error");}});
  return ()=>ctrl.abort();
 },[key,cycleState,teamId,cycleId,mode,version]);
 const selected=items.find(item=>item.snapshotId===selectedId)??null;
 const isClosed=closed||mode==="scrum"&&cycleStatus==="closed";
 const canDelete=role==="admin"&&!isClosed;
 function askDelete(item:Snapshot){
  if(!canDelete)return;
  setFeedback(null);setTarget(item);dialog.current?.showModal();
 }
 async function confirmDelete(){
  if(!target||!teamId||!cycleId||!mode||deleting)return;
  setDeleting(true);setFeedback(null);
  try{
   const res=await fetch("/api/admin/tickets/snapshots",{
    method:"DELETE",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,cycleId,mode,businessDate:target.businessDate,
      expectedSnapshotId:target.snapshotId}),
   });
   const result=await res.json() as {removed?:boolean};
   if(!res.ok||result.removed!==true)throw Error("delete-failed");
   dialog.current?.close();
   setTarget(null);setFeedback("deleted");setVersion(v=>v+1);
  }catch{setFeedback("error");}
  finally{setDeleting(false);}
 }
 const empty=cycleState==="ready"&&state==="ready"&&items.length===0;
 const loading=cycleState==="loading"||state==="loading";
 return <section className="smn-tickets-cockpit container-fluid px-3 px-lg-4 py-4" aria-label={t("tickets.title")}>
  <header className="smn-tickets-hero">
   <div className="smn-tickets-hero-top">
    <div>
     <h1><BootstrapIcon name="ticket-perforated-fill"/> {t("tickets.title")}</h1>
     <p>{t("tickets.subtitle")}</p>
    </div>
    <div className="smn-tickets-hero-actions">
     <button className="btn btn-light" disabled title={t("tickets.unavailableAction")}>
      <BootstrapIcon name="sliders"/> {t("tickets.indicators")}
     </button>
     <button className="btn btn-light" disabled title={t("tickets.unavailableAction")}>
      <BootstrapIcon name="bar-chart-line"/> {t("tickets.compare")}
     </button>
     <button className="btn btn-light" disabled title={t("tickets.unavailableAction")}>
      <BootstrapIcon name="plus-lg"/> {t("tickets.importCsv")}
     </button>
    </div>
   </div>
   <div className="smn-tickets-tabs" role="tablist" aria-label={t("tickets.title")}>
    <button id="smn-tickets-files-tab" className="smn-tickets-tab is-active" role="tab" type="button"
      aria-controls="smn-tickets-files-panel" aria-selected="true">
     <BootstrapIcon name="list-ul"/> {t("tickets.files")}
    </button>
    <button className="smn-tickets-tab" role="tab" type="button" disabled
      aria-selected="false" title={t("tickets.comingSoon")}>
     {t("tickets.consultation")}
    </button>
    <button className="smn-tickets-tab" role="tab" type="button" disabled
      aria-selected="false" title={t("tickets.comingSoon")}>
     {t("tickets.comparison")}
    </button>
   </div>
  </header>
  <div id="smn-tickets-files-panel" role="tabpanel" aria-labelledby="smn-tickets-files-tab">
   <section className="smn-tickets-context smn-tickets-panel" aria-label={t("tickets.cycle")}>
    <BootstrapIcon name="calendar-check"/>
    <div><strong>{t("tickets.cycle")}</strong>
     <span>{cycleName??t("tickets.noCycle")}</span>
    </div>
    {isClosed&&<span className="smn-tickets-status">{t("tickets.closed")}</span>}
   </section>
   {feedback&&<p role="status" className={"alert "+(feedback==="error"?"alert-danger":"alert-success")}>
    {t(feedback==="error"?"tickets.deleteError":"tickets.deleted")}
   </p>}
   <div className="smn-tickets-layout">
    <section className="smn-tickets-panel smn-tickets-files" aria-labelledby="smn-tickets-list-heading">
     <header className="smn-tickets-panel-heading">
      <h2 id="smn-tickets-list-heading"><BootstrapIcon name="list-ul"/> {t("tickets.listTitle")}</h2>
      <span className="smn-tickets-count">{items.length}</span>
     </header>
     {cycleState==="error"?<div role="alert" className="alert alert-danger">{t("tickets.error")}</div>:
      !cycleId||!teamId||!mode?<p className="smn-tickets-empty">{t("tickets.noCycle")}</p>:
      loading?<p role="status" className="smn-tickets-empty">{t("tickets.loading")}</p>:
      cycleState==="error"||state==="error"?<div role="alert" className="alert alert-danger">
       {t("tickets.error")}
       <button className="btn btn-outline-secondary btn-sm ms-2" type="button" onClick={()=>setVersion(v=>v+1)}>{t("tickets.retry")}</button>
      </div>:
      empty?<p className="smn-tickets-empty">{t("tickets.empty")}</p>:
      <div className="table-responsive">
       <table className="table smn-tickets-table">
        <thead><tr>
         <th scope="col">{t("tickets.businessDate")}</th>
         <th scope="col">{t("tickets.filename")}</th>
         <th scope="col">{t("tickets.size")}</th>
         <th scope="col" title={t("tickets.importedAtHelp")}>{t("tickets.importedAt")}</th>
         <th scope="col">{t("tickets.ticketCount")}</th>
         <th scope="col">{t("tickets.actions")}</th>
        </tr></thead>
        <tbody>{items.map(item=><tr key={item.snapshotId}
         className={item.snapshotId===selectedId?"is-selected":undefined}
         aria-selected={item.snapshotId===selectedId}>
         <td>{dateLabel(item.businessDate)}</td>
         <td><span className="smn-tickets-file-name">{item.originalFilename}</span></td>
         <td>{fmtSize(item.csvBytes,localeCode)}</td>
         <td>{importLabel(item.importedAt)}</td>
         <td>{item.rowCount}</td>
         <td><div className="smn-tickets-row-actions">
          <button className="btn btn-outline-primary btn-sm" type="button"
            aria-label={t("tickets.fileSelected",{filename:item.originalFilename})}
            aria-pressed={item.snapshotId===selectedId} onClick={()=>setSelectedId(item.snapshotId)}>
           <BootstrapIcon name="list-ul"/> {t("tickets.select")}
          </button>
          {role==="admin"&&<button className="btn btn-outline-danger btn-sm" type="button"
            disabled={!canDelete} title={!canDelete?t("tickets.deleteClosed"):t("tickets.delete")}
            aria-label={t("tickets.delete")+" : "+item.originalFilename}
            onClick={()=>askDelete(item)}><BootstrapIcon name="trash-fill"/></button>}
         </div></td>
        </tr>)}</tbody>
       </table>
      </div>}
    </section>
    <aside className="smn-tickets-panel smn-tickets-summary" aria-labelledby="smn-tickets-summary-heading">
     <header className="smn-tickets-panel-heading">
      <h2 id="smn-tickets-summary-heading"><BootstrapIcon name="bar-chart-line"/> {t("tickets.summary")}</h2>
     </header>
     <div className="smn-tickets-stat"><span>{t("tickets.filesCount")}</span><strong>{state==="ready"?items.length:"—"}</strong></div>
     <div className="smn-tickets-stat"><span>{t("tickets.selectedTickets")}</span><strong>{selected?.rowCount??"—"}</strong></div>
     {selected?<div className="smn-tickets-selected">
      <strong>{t("tickets.selected")}</strong>
      <span>{selected.originalFilename}</span>
      <small>{t("tickets.dateValue",{date:dateLabel(selected.businessDate)})}</small>
     </div>:<p className="smn-tickets-empty">{t("tickets.noSelection")}</p>}
     <p className="smn-tickets-note">{t("tickets.selectedHelp")}</p>
    </aside>
   </div>
  </div>
  <dialog className="smn-cockpit-modal smn-tickets-dialog" ref={dialog}
   aria-labelledby="smn-tickets-delete-title"
   onClose={()=>{if(!deleting)setTarget(null);}}>
   <div className="smn-cockpit-modal-header">
    <h2 id="smn-tickets-delete-title">{t("tickets.deleteTitle")}</h2>
    <button className="btn-close" type="button" disabled={deleting}
      aria-label={t("tickets.cancel")} onClick={()=>dialog.current?.close()}/>
   </div>
   <div className="smn-cockpit-modal-body">
    {target&&<p>{t("tickets.deleteDescription",{filename:target.originalFilename,date:dateLabel(target.businessDate)})}</p>}
    {feedback==="error"&&<p className="alert alert-danger" role="alert">{t("tickets.deleteError")}</p>}
   </div>
   <div className="smn-cockpit-modal-footer">
    <button type="button" className="btn btn-outline-secondary" disabled={deleting}
      onClick={()=>dialog.current?.close()}>{t("tickets.cancel")}</button>
    <button type="button" className="btn btn-danger" disabled={deleting}
      onClick={()=>void confirmDelete()}>
      <BootstrapIcon name="trash-fill"/> {deleting?t("tickets.busy"):t("tickets.delete")}
    </button>
   </div>
  </dialog>
 </section>;
}
