"use client";

import {useEffect,useMemo,useState} from "react";
import BootstrapIcon from "../bootstrap-icon";
import TicketsMetrics from "./tickets-metrics";
import {useLocale,useTranslation} from "@/i18n/client";
import type {TranslationKey} from "@/i18n/catalog";
import type {TicketCycleContext} from "../tickets-cycle-context";
import type {TicketBrowseDirection,TicketBrowseRow,TicketBrowseSort} from "@/lib/ticket-csv-browse";
import type {TicketSummaryScopes} from "@/lib/ticket-csv-summary";

type Snapshot={snapshotId:string;businessDate:string;originalFilename:string;rowCount:number;importedAt:string};
type BrowseResponse={
 rows:TicketBrowseRow[];total:number;sourceCount:number;page:number;pageSize:number;pageCount:number;
 facets:{issueTypes:string[];statuses:string[];priorities:string[];prefixes:string[]};
 summary:TicketSummaryScopes;
 jiraBaseUrl:string|null;
};
type Props={snapshot:Snapshot|null;context:TicketCycleContext;onBack:()=>void};
const keys:ReadonlyArray<{key:TicketBrowseSort;label:string}>=[
 {key:"jiraId",label:"browseJiraId"},{key:"issueType",label:"browseTicketType"},
 {key:"title",label:"browseTicketTitle"},{key:"priority",label:"browseTicketPriority"},
 {key:"status",label:"browseTicketStatus"},{key:"storyPoints",label:"browseStoryPoints"},
];
const blankFacets={issueTypes:[],statuses:[],priorities:[],prefixes:[]} as BrowseResponse["facets"];

export default function TicketsConsultation({snapshot,context,onBack}:Props){
 const t=useTranslation(),locale=useLocale();
 const [search,setSearch]=useState("");
 const [type,setType]=useState("");
 const [status,setStatus]=useState("");
 const [priority,setPriority]=useState("");
 const [prefix,setPrefix]=useState("");
 const [sort,setSort]=useState<TicketBrowseSort>("jiraId");
 const [direction,setDirection]=useState<TicketBrowseDirection>("asc");
 const [page,setPage]=useState(1);
 const [pageSize,setPageSize]=useState(50);
 const [data,setData]=useState<BrowseResponse|null>(null);
 const [state,setState]=useState<"loading"|"ready"|"error"|"forbidden">("loading");
 const [retry,setRetry]=useState(0);
 const snapshotId=snapshot?.snapshotId??"";
 const businessDate=snapshot?.businessDate??"";
 const teamId=context.teamId??"",cycleId=context.cycleId,mode=context.mode??"";
 const scopeKey=teamId+"|"+cycleId+"|"+mode+"|"+snapshotId;
 // Reset filters and pagination when a different team/cycle/file is selected.
 useEffect(()=>{
  setSearch("");setType("");setStatus("");setPriority("");setPrefix("");
  setSort("jiraId");setDirection("asc");setPage(1);setData(null);
 },[scopeKey]);
 const query=useMemo(()=>{
  if(!snapshot||!teamId||!cycleId||!mode)return null;
  return new URLSearchParams({
   teamId,cycleId,mode,businessDate,snapshotId,
   search,issueType:type,status,priority,prefix,sort,direction,
   page:String(page),pageSize:String(pageSize),
  }).toString();
 },[teamId,cycleId,mode,businessDate,snapshotId,search,type,status,priority,prefix,sort,direction,page,pageSize,snapshot]);
 useEffect(()=>{
  if(!query){setState("ready");setData(null);return;}
  const abort=new AbortController();
  setState("loading");
  void fetch("/api/admin/tickets/browse?"+query,{signal:abort.signal,cache:"no-store"})
   .then(async response=>{
    if(response.status===403)throw Error("forbidden");
    if(!response.ok)throw Error("unavailable");
    return response.json() as Promise<BrowseResponse>;
   }).then(result=>{
    if(abort.signal.aborted)return;
    if(!Array.isArray(result.rows)||!result.facets||!result.summary?.all||!result.summary?.filtered)
     throw Error("invalid-data");
    setData(result);setState("ready");
   }).catch(error=>{
    if(abort.signal.aborted)return;
    setData(null);setState((error as Error).message==="forbidden"?"forbidden":"error");
   });
  return ()=>abort.abort();
 },[query,retry]);
 const facets=data?.facets??blankFacets;
 const formatDate=(date:string)=>new Intl.DateTimeFormat(locale==="en"?"en-GB":"fr-FR",{
  day:"2-digit",month:"long",year:"numeric",timeZone:"UTC",
 }).format(new Date(date+"T00:00:00Z"));
 function orderBy(next:TicketBrowseSort){
  if(next===sort)setDirection(current=>current==="asc"?"desc":"asc");
  else {setSort(next);setDirection("asc");}
  setPage(1);
 }
 function reset(){
  setSearch("");setType("");setStatus("");setPriority("");setPrefix("");setPage(1);
 }
 const filter=(name:string,value:string,update:(value:string)=>void,options:string[])=>
  <label className="smn-tickets-browse-field">
   <span>{t(`tickets.${name}` as TranslationKey)}</span>
   <select className="form-select" value={value}
    onChange={event=>{update(event.target.value);setPage(1);}}>
    <option value="">{t("tickets.browseAll")}</option>
    {options.map(item=><option key={item} value={item}>{item}</option>)}
   </select>
  </label>;
 return <div className="smn-tickets-browse" aria-label={t("tickets.browseTitle")}>
  {!snapshot?<section className="smn-tickets-panel">
   <h2>{t("tickets.browseTitle")}</h2>
   <p>{t("tickets.browseNoSnapshot")}</p>
   <button type="button" className="btn btn-outline-primary" onClick={onBack}>
    <BootstrapIcon name="arrow-left"/> {t("tickets.browseGoFiles")}
   </button>
  </section>:<>
   <section className="smn-tickets-panel smn-tickets-browse-provenance" aria-label={t("tickets.browseSnapshot")}>
    <div>
     <strong><BootstrapIcon name="ticket-perforated-fill"/> {t("tickets.browseSnapshot")}</strong>
     <p>{snapshot.originalFilename} · {formatDate(snapshot.businessDate)}</p>
     <small>{t("tickets.browseIntro")}</small>
    </div>
    <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
     <BootstrapIcon name="arrow-left"/> {t("tickets.browseBack")}
    </button>
   </section>
   <section className="smn-tickets-panel smn-tickets-browse-filters" aria-labelledby="smn-tickets-browse-filters-heading">
    <div className="smn-tickets-panel-heading">
     <h2 id="smn-tickets-browse-filters-heading"><BootstrapIcon name="funnel"/> {t("tickets.browseFilters")}</h2>
    </div>
    <div className="smn-tickets-browse-filter-grid">
     <label className="smn-tickets-browse-field">
      <span>{t("tickets.browseSearch")}</span>
      <input type="search" value={search} className="form-control" maxLength={120}
       placeholder={t("tickets.browseSearchHint")}
       onChange={event=>{setSearch(event.target.value);setPage(1);}}/>
     </label>
     {filter("browseType",type,setType,facets.issueTypes)}
     {filter("browseStatus",status,setStatus,facets.statuses)}
     {filter("browsePriority",priority,setPriority,facets.priorities)}
     {filter("browsePrefix",prefix,setPrefix,facets.prefixes)}
     <div className="smn-tickets-browse-filter-reset">
      <button type="button" className="btn btn-outline-secondary" onClick={reset}>
       <BootstrapIcon name="funnel"/> {t("tickets.browseClear")}
      </button>
     </div>
    </div>
    <p className="smn-tickets-note">{t("tickets.browseFiltersNote")}</p>
   </section>
   {state==="ready"&&data&&<TicketsMetrics summary={data.summary}
    hasFilters={!!(search||type||status||priority||prefix)}/>}
   <section className="smn-tickets-panel smn-tickets-browse-results" aria-labelledby="smn-tickets-browse-results-heading">
    <header className="smn-tickets-panel-heading">
     <h2 id="smn-tickets-browse-results-heading"><BootstrapIcon name="list-ul"/> {t("tickets.browseResults")}</h2>
     {data&&<span className="smn-tickets-count">{t("tickets.browseResultCount",{
      shown:data.rows.length,total:data.total,source:data.sourceCount,
     })}</span>}
    </header>
    {state==="loading"?<p role="status">{t("tickets.browseLoading")}</p>:
     state==="forbidden"?<p role="alert" className="alert alert-warning">{t("tickets.browseNoAccess")}</p>:
     state==="error"?<div className="alert alert-danger" role="alert">
      {t("tickets.browseError")}
      <button type="button" className="btn btn-outline-secondary btn-sm ms-2"
       onClick={()=>setRetry(value=>value+1)}>{t("tickets.browseRetry")}</button>
     </div>:
     data&&data.rows.length===0?<p>{t("tickets.browseEmpty")}</p>:
     data&&<div className="table-responsive">
      <table className="table smn-tickets-table smn-tickets-browse-table">
       <thead><tr>{keys.map(column=><th key={column.key} scope="col">
        <button type="button" className="smn-tickets-sort-button" onClick={()=>orderBy(column.key)}
         aria-label={t(`tickets.${column.label}` as TranslationKey)+" · "+t(sort===column.key&&direction==="desc"?
           "tickets.browseSortDesc":"tickets.browseSortAsc")}>
         {t(`tickets.${column.label}`)}{sort===column.key?" "+(direction==="asc"?"↑":"↓"):""}
        </button></th>)}</tr></thead>
       <tbody>{data.rows.map(row=><tr key={row.jiraId}>
        <td><strong>{row.jiraId}</strong></td>
        <td>{row.issueType||t("tickets.browseMissing")}</td>
        <td className="smn-tickets-browse-title">{row.title||t("tickets.browseMissing")}</td>
        <td>{row.priority||t("tickets.browseMissing")}</td>
        <td>{row.completed?<span className="smn-tickets-browse-done">
          <BootstrapIcon name="calendar-check"/> {row.status}
         </span>:row.status||t("tickets.browseMissing")}</td>
        <td>{row.storyPoints||t("tickets.browseMissing")}</td>
       </tr>)}</tbody>
      </table>
     </div>}
    {data&&data.total>0&&<div className="smn-tickets-browse-pagination">
     <label>{t("tickets.browseRows")}{" "}
      <select className="form-select form-select-sm" value={pageSize}
       onChange={event=>{setPageSize(Number(event.target.value));setPage(1);}}>
       {[25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
      </select>
     </label>
     <div>
      <button type="button" className="btn btn-outline-secondary btn-sm"
       disabled={data.page<=1} onClick={()=>setPage(n=>n-1)}>
       {t("tickets.browsePrevious")}
      </button>
      <span>{t("tickets.browsePage",{page:data.page,count:data.pageCount})}</span>
      <button type="button" className="btn btn-outline-secondary btn-sm"
       disabled={data.page>=data.pageCount} onClick={()=>setPage(n=>n+1)}>
       {t("tickets.browseNext")}
      </button>
     </div>
    </div>}
    <p className="smn-tickets-note">{t("tickets.browseJiraLinkPending")}</p>
   </section>
  </>}
 </div>;
}
