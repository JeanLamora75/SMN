"use client";
import Link from "next/link";
import {useDeferredValue,useEffect,useState} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import type {SprintIndexItem,SprintIndexSort} from "@/server/sprints/index";
import type {TranslationKey} from "@/i18n/catalog";
import {sprintDetailPath} from "@/lib/sprint-detail-path";

type Result={
 teamName:string;items:SprintIndexItem[];total:number;page:number;pageSize:number;
 totalPages:number;statuses:string[];activeCount:number;
};
const known=["planned","active","finished","closed","suspended"] as const;

export default function SprintIndexView({canManage,initialFilters,teamId}:{canManage:boolean;initialFilters?:{search:string;status:string;sort:SprintIndexSort;page:number};teamId:string|null}){
 const t=useTranslation(),locale=useLocale();
 const [search,setSearch]=useState(initialFilters?.search??"");
 const deferredSearch=useDeferredValue(search);
 const [filter,setFilter]=useState(initialFilters?.status??"all");
 const [sort,setSort]=useState<SprintIndexSort>(initialFilters?.sort??"priority");
 const [page,setPage]=useState(initialFilters?.page??1);
 const [refresh,setRefresh]=useState(0);
 const [data,setData]=useState<Result|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  const ctrl=new AbortController();
  const params=new URLSearchParams({search:deferredSearch,status:filter,sort,page:String(page)});
  if(teamId)params.set("teamId",teamId);
  void fetch("/api/sprints/index?"+params.toString(),{cache:"no-store",signal:ctrl.signal})
   .then(async response=>{
    if(!response.ok)throw Error("index-unavailable");
    return response.json() as Promise<Result>;
   })
   .then(result=>{
    if(ctrl.signal.aborted)return;
    if(!Array.isArray(result.items)||!Number.isInteger(result.totalPages)||result.totalPages<1)
     throw Error("index-invalid");
    setData(result);setLoading(false);setError(false);
   })
   .catch(()=>{if(!ctrl.signal.aborted){setLoading(false);setError(true);}});
  return()=>ctrl.abort();
 },[deferredSearch,filter,sort,page,refresh,teamId]);
 const label=(item:SprintIndexItem)=>{
  const status=item.suspended?"suspended":item.status;
  const map:Record<string,TranslationKey>={
   planned:"sprintStates.planned",active:"sprintStates.active",finished:"sprintStates.finished",closed:"sprintStates.closed",suspended:"sprintStates.suspended"
  };
  return map[status]?t(map[status]):status;
 };
 const day=(stamp:string,zone:string)=>{
  const at=new Date(stamp);
  if(!Number.isFinite(at.getTime()))return stamp;
  try{
   return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
    timeZone:zone,day:"2-digit",month:"short",year:"numeric"
   }).format(at);
  }catch{return stamp;}
 };
 const statuses=[...new Set([...known,...(data?.statuses??[])])];
 const change=(fn:()=>void)=>{setLoading(true);setNotice("");fn();setPage(1);};
 const reload=()=>{setLoading(true);setNotice("");setRefresh(n=>n+1);};
 const indicatorCodes=["f01","f04","f07","f10","f11","f12"] as const;
 const number=(value:number|null|undefined,code:typeof indicatorCodes[number])=>{
  if(value===null||value===undefined||!Number.isFinite(value))return "—";
  const formatted=new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{
   maximumFractionDigits:code==="f07"||code==="f12"?2:0
  }).format(value);
  return formatted+" "+(code==="f07"||code==="f12"?"%":code==="f10"||code==="f11"?"tck":"sp");
 };
 const gauge=(value:number)=> {
  const ratio=Math.min(100,Math.max(0,value));
  const angle=180+(ratio*1.8);
  const radians=angle*Math.PI/180;
  const x=22+14*Math.cos(radians),y=22+14*Math.sin(radians);
  return <svg className="smn-sprints-gauge" viewBox="0 0 44 30" aria-hidden="true" focusable="false">
   <path d="M 6 22 A 16 16 0 0 1 38 22" fill="none" stroke="var(--bs-secondary-bg)" strokeWidth="5" strokeLinecap="round"/>
   <path d="M 6 22 A 16 16 0 0 1 38 22" fill="none" stroke="var(--bs-primary)" strokeWidth="5" strokeLinecap="round"
    strokeDasharray={String(ratio/100*50.27)+" 50.27"}/>
   <line x1="22" y1="22" x2={x} y2={y} stroke="var(--bs-body-color)" strokeWidth="2" strokeLinecap="round"/>
   <circle cx="22" cy="22" r="2.8" fill="var(--bs-body-color)"/>
  </svg>;
 };
 const items=data?.items??[];
 const generateHref="/app/admin/sprints/generate?"+new URLSearchParams({search,status:filter,sort,page:String(page)}).toString();
 const mainStatuses=new Set(["all","active","planned","finished","closed"]);
 const allStatuses=[...new Set([...statuses,filter])].filter(status=>status!=="all");
 const extraStatuses=allStatuses.filter(status=>!mainStatuses.has(status));
 const tabs=[
  {status:"all",text:t("sprintsIndex.allStatuses")},
  {status:"active",text:t("sprintStates.active")},
  {status:"planned",text:t("sprintStates.planned")},
  {status:"finished",text:t("sprintStates.finished")},
  {status:"closed",text:t("sprintStates.closed")}
 ];

 return <div className="smn-sprints-cockpit d-grid gap-3">
  <header className="smn-sprints-hero">
   <div className="smn-sprints-hero-top">
    <div className="smn-sprints-identity">
     <h1>{t("sprintsIndex.title")}</h1>
     <p>{data?.teamName??t("sprintsIndex.teamUnknown")} · Scrum</p>
    </div>
    {canManage&&<div className="smn-sprints-hero-actions">
     <Link className="btn smn-sprints-secondary-action" href="/app/admin/sprints/historical">
      {t("sprintsIndex.historical")}
     </Link>
     <Link className="btn smn-sprints-primary-action" href={generateHref}>
      <span aria-hidden="true">＋</span>{t("sprintsIndex.generate")}
     </Link>
    </div>}
   </div>
   <div className="smn-sprints-state-tabs" role="group" aria-label={t("sprintsIndex.statusFilter")}>
    {tabs.map(tab=><button key={tab.status} type="button"
     className="smn-sprints-state-tab" aria-pressed={filter===tab.status}
     onClick={()=>change(()=>setFilter(tab.status))}>{tab.text}</button>)}
    {extraStatuses.length>0&&<select className="smn-sprints-extra-select"
     aria-label={t("sprintsIndex.otherStatuses")}
     value={extraStatuses.includes(filter)?filter:""}
     onChange={event=>{if(event.target.value)change(()=>setFilter(event.target.value));}}>
     <option value="">{t("sprintsIndex.otherStatuses")}</option>
     {extraStatuses.map(status=><option key={status} value={status}>
      {label({status,suspended:status==="suspended"} as SprintIndexItem)}
     </option>)}
    </select>}
   </div>
   <div className="smn-sprints-state-mobile">
    <label htmlFor="sprint-index-status" className="visually-hidden">{t("sprintsIndex.statusFilter")}</label>
    <select id="sprint-index-status" className="form-select" value={filter}
     onChange={event=>change(()=>setFilter(event.target.value))}>
     <option value="all">{t("sprintsIndex.allStatuses")}</option>
     {allStatuses.map(status=><option key={status} value={status}>
      {label({status,suspended:status==="suspended"} as SprintIndexItem)}
     </option>)}
    </select>
   </div>
  </header>
  <section className="smn-sprints-filters" aria-label={t("sprintsIndex.filters")}>
   <div className="smn-sprints-filters-heading">
    <h2>{t("sprintsIndex.filtersHeading")}</h2>
    <div className="smn-sprints-context">
     <span>{t("sprintsIndex.teamLabel")}: {data?.teamName??t("sprintsIndex.teamUnknown")}</span>
     {!loading&&!error&&data&&<span>{t("sprintsIndex.total",{count:data.total})}</span>}
    </div>
   </div>
   <div className="smn-sprints-filter-fields">
    <div>
     <label className="form-label" htmlFor="sprint-index-search">{t("sprintsIndex.search")}</label>
     <input id="sprint-index-search" className="form-control" type="search"
      maxLength={100} value={search} placeholder={t("sprintsIndex.searchPlaceholder")}
      onChange={event=>change(()=>setSearch(event.target.value))}/>
    </div>
    <div>
     <label htmlFor="sprint-index-sort" className="form-label">{t("sprintsIndex.sort")}</label>
     <select id="sprint-index-sort" className="form-select" value={sort}
      onChange={event=>change(()=>setSort(event.target.value as SprintIndexSort))}>
      <option value="priority">{t("sprintsIndex.priority")}</option>
      <option value="newest">{t("sprintsIndex.newest")}</option>
      <option value="oldest">{t("sprintsIndex.oldest")}</option>
     </select>
    </div>
   </div>
   <div className="smn-sprints-filter-footer">
    <span className="small" role="status" aria-live="polite">
     {loading?t("sprintsIndex.loading"):error?t("sprintsIndex.error"):data?t("sprintsIndex.total",{count:data.total}):""}
    </span>
    <button type="button" className="btn btn-outline-secondary btn-sm"
     onClick={reload} disabled={loading}>{t("sprintStates.refresh")}</button>
   </div>
  </section>
  <section className="smn-sprints-results" aria-label={t("sprintsIndex.list")}>
   {error&&<div role="alert" className="alert alert-warning">
    {t("sprintsIndex.error")}
    <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={reload}>
     {t("common.retry")}</button>
   </div>}
   {notice&&<p role="status" className="alert alert-info">{notice}</p>}
   {data&&data.activeCount>1&&<p role="alert" className="alert alert-warning">{t("sprintsIndex.concurrentActive",{count:data.activeCount})}</p>}
   {!error&&!loading&&data?.total===0&&
    <div className="text-center py-5">
     <h2 className="h5">{search.trim()||filter!=="all"?
      t("sprintsIndex.noMatches"):t("sprintsIndex.empty")}</h2>
     <p className="text-secondary">{search.trim()||filter!=="all"?
      t("sprintsIndex.tryFilters"):t("sprintsIndex.emptyHint")}</p>
     {canManage&&!search.trim()&&filter==="all"&&
      <Link href={generateHref} className="btn btn-outline-primary">
       {t("sprintsIndex.generate")}</Link>}
    </div>}
   {(!error&&!loading&&items.length>0)&&<>
    <div className="table-responsive smn-sprints-table-wrap">
     <table className="table table-hover align-middle smn-sprints-table">
      <thead><tr>
       <th scope="col">{t("sprintStates.name")}</th>
       <th scope="col">{t("sprintStates.status")}</th>
       <th scope="col">{t("sprintsIndex.period")}</th>
       {indicatorCodes.map(code=><th scope="col" key={code}
        title={t(`sprintsIndex.indicatorColumns.${code}`)}
        aria-label={t(`sprintsIndex.indicatorColumns.${code}`)} tabIndex={0}
        className="text-center">{code.toUpperCase()}</th>)}
       <th scope="col" className="text-center">{t("sprintsIndex.actions")}</th>
      </tr></thead>
      <tbody>{items.map(item=>{
       const current=item.status==="active"&&!item.suspended&&!item.stateMayBeStale;
       return <tr key={item.id} className={current?"smn-sprints-current":""}>
        <th scope="row">
         <Link href={sprintDetailPath(item.id)} className="smn-sprints-row-title fw-semibold">{item.name}</Link>
         {item.stateMayBeStale&&<small className="d-block text-warning-emphasis">
          {t("sprintsIndex.stateUnverified")}</small>}
        </th>
        <td data-label={t("sprintStates.status")}><span className={"badge smn-sprints-status "+(item.suspended?"smn-sprints-state-muted":
          item.status==="active"?"smn-sprints-state-active":
          item.status==="planned"?"smn-sprints-state-planned":
          item.status==="finished"||item.status==="closed"?"smn-sprints-state-complete":"smn-sprints-state-muted")}>
         {label(item)}</span></td>
        <td data-label={t("sprintsIndex.period")}><time dateTime={item.startAt}>{day(item.startAt,item.timeZone)}</time>
         {" — "}<time dateTime={item.endAt}>{day(item.endAt,item.timeZone)}</time></td>
        {indicatorCodes.map(code=><td key={code} className={(code==="f07"||code==="f12"?"smn-sprints-gauge-cell":"text-end")+" text-nowrap"}
         data-label={code.toUpperCase()} title={t(`sprintsIndex.indicatorColumns.${code}`)}>
         {(code==="f07"||code==="f12")&&item.metrics?.[code]!=null?
          <span className="smn-sprints-percent" aria-label={number(item.metrics[code],code)}>
           {gauge(item.metrics[code])}<span>{number(item.metrics[code],code)}</span>
          </span>:number(item.metrics?.[code],code)}</td>)}

        <td className="text-end smn-sprints-row-actions" data-label={t("sprintsIndex.actions")}>
         <div className="d-inline-flex gap-2 align-items-center">
          <button type="button" className="btn btn-sm btn-outline-secondary"
           title={t("sprintsIndex.calendarPending")} aria-label={t("sprintsIndex.calendarPending")}
           onClick={()=>setNotice(t("sprintsIndex.calendarPending"))}>▦</button>
          {canManage?<details className="d-inline-block text-start smn-sprints-actions-menu">
           <summary className="btn btn-sm btn-outline-secondary"
            aria-label={t("sprintsIndex.rowActions",{name:item.name})}>⋯</summary>
           <div className="border rounded bg-body p-2 mt-2 shadow-sm"
            style={{minWidth:190}}>
            <p className="small text-secondary mb-2">{t("sprintsIndex.actionsPending")}</p>
            <Link href="/app/admin/sprints/tools#sprint-operations"
             className="d-block">{t("sprintsIndex.legacyTools")}</Link>
           </div>
          </details>:<span className="text-secondary small">—</span>}
         </div>
        </td>
       </tr>;
      })}</tbody>
     </table>
    </div>
    <div className="smn-sprints-pagination">
     <span className="small">{t("sprintsIndex.page",{
      page:data?.page??page,total:data?.totalPages??1})}</span>
     <div className="btn-group">
      <button type="button" className="btn btn-outline-secondary btn-sm"
       disabled={loading||(data?.page??1)<=1}
       onClick={()=>{setLoading(true);setPage(p=>Math.max(1,p-1));}}>
       {t("sprintsIndex.previous")}</button>
      <button type="button" className="btn btn-outline-secondary btn-sm"
       disabled={loading||(data?.page??1)>=(data?.totalPages??1)}
       onClick={()=>{setLoading(true);setPage(p=>p+1);}}>
       {t("sprintsIndex.next")}</button>
     </div>
    </div>
   </>}
   {loading&&<p role="status" className="text-secondary">{t("sprintsIndex.loading")}</p>}
  </section>
  {canManage&&<p className="smn-sprints-legacy-note small mb-0">
   {t("sprintsIndex.transitionNote")} <Link href="/app/admin/sprints/tools">
    {t("sprintsIndex.legacyTools")}</Link>
  </p>}
 </div>;
}
