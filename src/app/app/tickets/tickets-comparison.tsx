"use client";

import {useEffect,useMemo,useState} from "react";
import BootstrapIcon from "../bootstrap-icon";
import {jiraTicketUrl} from "@/lib/tickets/jira-links";
import {useLocale,useTranslation} from "@/i18n/client";
import type {TranslationKey} from "@/i18n/catalog";
import type {TicketsCycleContext} from "../tickets-cycle-context";
import type {
 TicketChange,TicketChangeField,TicketChangeKind,TicketComparisonCounts,
} from "@/lib/ticket-csv-compare";

type Snapshot={snapshotId:string;businessDate:string;originalFilename:string};
type Result={
 older:{snapshotId:string;businessDate:string};
 newer:{snapshotId:string;businessDate:string};
 counts:TicketComparisonCounts;
 total:number;page:number;pageSize:number;pageCount:number;changes:TicketChange[];
 jiraBaseUrl:string|null;
};
type Props={
 context:TicketsCycleContext;
 snapshots:readonly Snapshot[];
 onBack:()=>void;
};
const kindOptions:ReadonlyArray<{value:string;label:string}>=[
 {value:"all",label:"compareAll"},
 {value:"added",label:"compareAdded"},
 {value:"removed",label:"compareRemoved"},
 {value:"completed",label:"compareCompleted"},
 {value:"reopened",label:"compareReopened"},
 {value:"storyPointsChanged",label:"compareSp"},
 {value:"otherChanged",label:"compareOther"},
];
const fieldKeys:Record<TicketChangeField,
 "compareFieldsType"|"compareFieldsTitle"|"compareFieldsPriority"|"compareFieldsStatus"|"compareFieldsSp">={
 issueType:"compareFieldsType",title:"compareFieldsTitle",priority:"compareFieldsPriority",
 status:"compareFieldsStatus",storyPoints:"compareFieldsSp",
};

function orderedFiles(files:readonly Snapshot[]):Snapshot[]{
 return [...files].sort((a,b)=>a.businessDate.localeCompare(b.businessDate)||
 a.snapshotId.localeCompare(b.snapshotId));
}
export function pickComparisonDefaults(files:readonly Snapshot[]):[string,string]{
 const ordered=orderedFiles(files);
 return ordered.length<2?["",""]:[
  ordered[ordered.length-2].snapshotId,ordered[ordered.length-1].snapshotId,
 ];
}

export default function TicketsComparison({context,snapshots,onBack}:Props){
 const t=useTranslation(),locale=useLocale();
 const sorted=useMemo(()=>orderedFiles(snapshots),[snapshots]);
 const [initialOld,initialNew]=pickComparisonDefaults(sorted);
 const [oldId,setOldId]=useState(initialOld);
 const [newId,setNewId]=useState(initialNew);
 const [kind,setKind]=useState("all");
 const [search,setSearch]=useState("");
 const [page,setPage]=useState(1);
 const [pageSize,setPageSize]=useState(50);
 const [retry,setRetry]=useState(0);
 const [data,setData]=useState<Result|null>(null);
 const [state,setState]=useState<"loading"|"ready"|"error"|"forbidden">("loading");
 const oldFile=sorted.find(item=>item.snapshotId===oldId);
 const newFile=sorted.find(item=>item.snapshotId===newId);
 const validPair=!!oldFile&&!!newFile&&oldId!==newId&&oldFile.businessDate!==newFile.businessDate;
 const older=validPair?(oldFile!.businessDate<newFile!.businessDate?oldFile!:newFile!):null;
 const newer=validPair?(older===oldFile?newFile!:oldFile!):null;
 const localeCode=locale==="en"?"en-GB":"fr-FR";
 const displayDate=(value:string)=>new Intl.DateTimeFormat(localeCode,{
  day:"2-digit",month:"long",year:"numeric",timeZone:"UTC",
 }).format(new Date(value+"T00:00:00Z"));
 const displayFile=(file:Snapshot)=>t("tickets.compareFile",{
  name:file.originalFilename,date:displayDate(file.businessDate),
 });

 const query=useMemo(()=>{
  if(!validPair||!oldFile||!newFile||!context.teamId||!context.cycleId||!context.mode)return null;
  return new URLSearchParams({
   teamId:context.teamId,cycleId:context.cycleId,mode:context.mode,
   firstDate:oldFile.businessDate,firstId:oldFile.snapshotId,
   secondDate:newFile.businessDate,secondId:newFile.snapshotId,
   kind,search,page:String(page),pageSize:String(pageSize),
  }).toString();
 },[validPair,oldFile,newFile,context.teamId,context.cycleId,context.mode,kind,search,page,pageSize]);

 useEffect(()=>{
  if(!query){queueMicrotask(()=>{setData(null);setState("ready");});return;}
  const controller=new AbortController();
  queueMicrotask(()=>{if(!controller.signal.aborted)setState("loading");});
  void fetch("/api/admin/tickets/compare?"+query,{signal:controller.signal,cache:"no-store"})
   .then(async response=>{
    if(response.status===403)throw Error("forbidden");
    if(!response.ok)throw Error("compare-unavailable");
    return response.json() as Promise<Result>;
   }).then(result=>{
    if(controller.signal.aborted)return;
    if(!result.counts||!Array.isArray(result.changes))throw Error("invalid-result");
    setData(result);setState("ready");
   }).catch(error=>{
    if(controller.signal.aborted)return;
    setData(null);
    setState((error as Error).message==="forbidden"?"forbidden":"error");
   });
  return ()=>controller.abort();
 },[query,retry]);

 function resetFilters(){setSearch("");setKind("all");setPage(1);}
 const counts=data?.counts;
 const countCards:ReadonlyArray<{key:keyof TicketComparisonCounts;label:string}>=[
  {key:"added",label:"compareAdded"},{key:"removed",label:"compareRemoved"},
  {key:"completed",label:"compareCompleted"},{key:"reopened",label:"compareReopened"},
  {key:"storyPointsChanged",label:"compareSp"},{key:"otherChanged",label:"compareOther"},
  {key:"changedTickets",label:"compareChanged"},{key:"unchangedTickets",label:"compareUnchanged"},
 ];
 function kindsText(kinds:readonly TicketChangeKind[]){
  return kinds.map(value=>t("tickets."+kindOptions.find(option=>option.value===value)!.label as
   "tickets.compareAdded"|"tickets.compareRemoved"|"tickets.compareCompleted"|
   "tickets.compareReopened"|"tickets.compareSp"|"tickets.compareOther")).join(", ");
 }
 return <div className="smn-tickets-compare" aria-label={t("tickets.compareTitle")}>
  <section className="smn-tickets-panel" aria-labelledby="smn-tickets-compare-choice-title">
   <div className="smn-tickets-panel-heading">
    <h2 id="smn-tickets-compare-choice-title"><BootstrapIcon name="list-ul"/> {t("tickets.compareChoose")}</h2>
    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onBack}>
     <BootstrapIcon name="arrow-left"/> {t("tickets.compareBack")}
    </button>
   </div>
   {sorted.length<2?<p role="status" className="smn-tickets-empty">{t("tickets.compareNotEnough")}</p>:<>
    <div className="smn-tickets-compare-selectors">
     <label><span>{t("tickets.compareOlder")}</span>
      <select className="form-select" value={oldId} onChange={event=>{
       setOldId(event.target.value);setPage(1);setData(null);
      }}>
       {sorted.map(file=><option key={file.snapshotId} value={file.snapshotId}
        disabled={file.snapshotId===newId}>{displayFile(file)}</option>)}
      </select>
     </label>
     <label><span>{t("tickets.compareNewer")}</span>
      <select className="form-select" value={newId} onChange={event=>{
       setNewId(event.target.value);setPage(1);setData(null);
      }}>
       {sorted.map(file=><option key={file.snapshotId} value={file.snapshotId}
        disabled={file.snapshotId===oldId}>{displayFile(file)}</option>)}
      </select>
     </label>
    </div>
    {older&&newer?<div className="smn-tickets-compare-dates">
     <span>{t("tickets.compareOlder")}: <strong>{displayFile(older)}</strong></span>
     <span>{t("tickets.compareNewer")}: <strong>{displayFile(newer)}</strong></span>
    </div>:<p role="status" className="smn-tickets-empty">{t("tickets.compareSelectPrompt")}</p>}
   </>}
  </section>
  {validPair&&<>
   <section className="smn-tickets-panel smn-tickets-compare-summary" aria-labelledby="smn-tickets-compare-summary-title">
    <div className="smn-tickets-panel-heading">
     <h2 id="smn-tickets-compare-summary-title"><BootstrapIcon name="bar-chart-line"/> {t("tickets.compareSummary")}</h2>
    </div>
    {state==="loading"?<p role="status">{t("tickets.compareLoading")}</p>:
     state==="forbidden"?<p className="alert alert-warning" role="alert">{t("tickets.compareForbidden")}</p>:
     state==="error"?<div className="alert alert-danger" role="alert">
      {t("tickets.compareError")}
      <button className="btn btn-outline-secondary btn-sm ms-2" type="button" onClick={()=>setRetry(n=>n+1)}>
       {t("tickets.compareRetry")}
      </button>
     </div>:counts&&<>
      <div className="smn-tickets-compare-counts" aria-label={t("tickets.compareSummary")}>
       {countCards.map(card=><div key={card.key}>
        <span>{t("tickets."+card.label as
         "tickets.compareAdded"|"tickets.compareRemoved"|"tickets.compareCompleted"|
         "tickets.compareReopened"|"tickets.compareSp"|"tickets.compareOther"|
         "tickets.compareChanged"|"tickets.compareUnchanged")}</span>
        <strong>{counts[card.key]}</strong>
       </div>)}
      </div>
      <p className="smn-tickets-note">{t("tickets.compareOldCount")}: {counts.oldTickets}
       {" · "}{t("tickets.compareNewCount")}: {counts.newTickets}</p>
      <p className="smn-tickets-note">{t("tickets.compareExplanations")}</p>
      <p className="smn-tickets-note">{t("tickets.compareRemovedNote")}</p>
     </>}
   </section>
   <section className="smn-tickets-panel smn-tickets-compare-filters" aria-labelledby="smn-tickets-compare-filters-title">
    <div className="smn-tickets-panel-heading">
     <h2 id="smn-tickets-compare-filters-title"><BootstrapIcon name="funnel"/> {t("tickets.browseFilters")}</h2>
    </div>
    <div className="smn-tickets-compare-filter-grid">
     <label><span>{t("tickets.compareSearch")}</span>
      <input type="search" className="form-control" maxLength={120} value={search}
       onChange={event=>{setSearch(event.target.value);setPage(1);}}/>
     </label>
     <label><span>{t("tickets.compareKinds")}</span>
      <select className="form-select" value={kind} onChange={event=>{setKind(event.target.value);setPage(1);}}>
       {kindOptions.map(option=><option key={option.value} value={option.value}>
        {t("tickets."+option.label as
         "tickets.compareAll"|"tickets.compareAdded"|"tickets.compareRemoved"|
         "tickets.compareCompleted"|"tickets.compareReopened"|"tickets.compareSp"|"tickets.compareOther")}
       </option>)}
      </select>
     </label>
     <div><button className="btn btn-outline-secondary" type="button" onClick={resetFilters}>
      <BootstrapIcon name="funnel"/> {t("tickets.compareClear")}</button></div>
    </div>
   </section>
   <section className="smn-tickets-panel smn-tickets-compare-results" aria-labelledby="smn-tickets-compare-results-title">
    <div className="smn-tickets-panel-heading">
     <h2 id="smn-tickets-compare-results-title"><BootstrapIcon name="list-ul"/> {t("tickets.compareDetails")}</h2>
     {state==="ready"&&data&&<span className="smn-tickets-count">
      {t("tickets.compareCount",{shown:data.changes.length,total:data.total})}</span>}
    </div>
    {state==="loading"?<p role="status">{t("tickets.compareLoading")}</p>:
     state==="ready"&&data?.total===0?<p className="smn-tickets-empty">{t("tickets.compareNone")}</p>:
     state==="ready"&&data?<div className="table-responsive">
      <table className="table smn-tickets-table smn-tickets-compare-table">
       <thead><tr>
        <th scope="col">{t("tickets.compareTicket")}</th>
        <th scope="col">{t("tickets.compareCategory")}</th>
        <th scope="col">{t("tickets.comparePrevious")}</th>
        <th scope="col">{t("tickets.compareCurrent")}</th>
        <th scope="col">{t("tickets.compareFields")}</th>
       </tr></thead>
       <tbody>{data.changes.map(change=><tr key={change.jiraId}>
        <td>{jiraTicketUrl(data.jiraBaseUrl,change.jiraId)?<a
         href={jiraTicketUrl(data.jiraBaseUrl,change.jiraId)!} target="_blank" rel="noopener noreferrer"
         aria-label={t("tickets.jiraTicketOpen",{id:change.jiraId})}>{change.jiraId}</a>:
         <strong>{change.jiraId}</strong>}</td>
        <td>{kindsText(change.kinds)}</td>
        <td>{change.before?.title??t("tickets.compareMissing")}</td>
        <td>{change.after?.title??t("tickets.compareMissing")}</td>
        <td>{change.fields.length?<details>
         <summary>{change.fields.length} {t("tickets.compareFields")}</summary>
         <ul>{change.fields.map(field=><li key={field.field}>
          <strong>{t(("tickets."+fieldKeys[field.field]) as TranslationKey)}</strong>:
          {" "}{field.before||t("tickets.compareNoValue")}
          {" → "}{field.after||t("tickets.compareNoValue")}
         </li>)}</ul>
        </details>:t("tickets.compareNoValue")}</td>
       </tr>)}</tbody>
      </table>
     </div>:null}
    {state==="ready"&&data&&data.total>0&&<div className="smn-tickets-browse-pagination">
     <label>{t("tickets.comparePageSize")}
      <select className="form-select form-select-sm" value={pageSize} onChange={event=>{
       setPageSize(Number(event.target.value));setPage(1);
      }}>{[25,50,100].map(n=><option value={n} key={n}>{n}</option>)}</select>
     </label>
     <div>
      <button type="button" className="btn btn-outline-secondary btn-sm" disabled={data.page<=1}
       onClick={()=>setPage(p=>Math.max(1,p-1))}>{t("tickets.comparePreviousPage")}</button>
      <span>{t("tickets.comparePage",{page:data.page,pages:data.pageCount})}</span>
      <button type="button" className="btn btn-outline-secondary btn-sm" disabled={data.page>=data.pageCount}
       onClick={()=>setPage(p=>p+1)}>{t("tickets.compareNextPage")}</button>
     </div>
    </div>}
   </section>
  </>}
 </div>;
}
