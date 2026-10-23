"use client";
import Link from "next/link";
import {useDeferredValue,useEffect,useState} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import type {SprintIndexItem,SprintIndexSort} from "@/server/sprints/index";
import type {TranslationKey} from "@/i18n/catalog";

type Result={
 teamName:string;items:SprintIndexItem[];total:number;page:number;pageSize:number;
 totalPages:number;statuses:string[];activeCount:number;
};
const known=["planned","active","finished","closed","suspended"] as const;

export default function SprintIndexView({canManage}:{canManage:boolean}){
 const t=useTranslation(),locale=useLocale();
 const [search,setSearch]=useState("");
 const deferredSearch=useDeferredValue(search);
 const [filter,setFilter]=useState("all");
 const [sort,setSort]=useState<SprintIndexSort>("priority");
 const [page,setPage]=useState(1);
 const [refresh,setRefresh]=useState(0);
 const [data,setData]=useState<Result|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  const ctrl=new AbortController();
  const params=new URLSearchParams({search:deferredSearch,status:filter,sort,page:String(page)});
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
 },[deferredSearch,filter,sort,page,refresh]);
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
 const items=data?.items??[];
 return <div className="d-grid gap-4">
  <header className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
   <div>
    <h1 className="h3 mb-1">{t("sprintsIndex.title")}</h1>
    <p className="text-secondary mb-0">{data?.teamName??t("sprintsIndex.teamUnknown")} · Scrum</p>
   </div>
   {canManage&&<Link className="btn btn-primary"
    href="/app/admin/sprints/tools#create-sprints">{t("sprintsIndex.generate")}</Link>}
  </header>
  <section className="smn-panel rounded-4 p-3 p-md-4 d-grid gap-3" aria-label={t("sprintsIndex.filters")}>
   <div className="row g-3 align-items-end">
    <div className="col-12 col-lg-6">
     <label className="form-label" htmlFor="sprint-index-search">{t("sprintsIndex.search")}</label>
     <input id="sprint-index-search" className="form-control" type="search"
      maxLength={100} value={search} placeholder={t("sprintsIndex.searchPlaceholder")}
      onChange={event=>change(()=>setSearch(event.target.value))}/>
    </div>
    <div className="col-6 col-lg-3">
     <label htmlFor="sprint-index-status" className="form-label">{t("sprintsIndex.statusFilter")}</label>
     <select id="sprint-index-status" className="form-select" value={filter}
      onChange={event=>change(()=>setFilter(event.target.value))}>
      <option value="all">{t("sprintsIndex.allStatuses")}</option>
      {statuses.map(status=><option key={status} value={status}>
       {label({status,suspended:status==="suspended"} as SprintIndexItem)}
      </option>)}
     </select>
    </div>
    <div className="col-6 col-lg-3">
     <label htmlFor="sprint-index-sort" className="form-label">{t("sprintsIndex.sort")}</label>
     <select id="sprint-index-sort" className="form-select" value={sort}
      onChange={event=>change(()=>setSort(event.target.value as SprintIndexSort))}>
      <option value="priority">{t("sprintsIndex.priority")}</option>
      <option value="newest">{t("sprintsIndex.newest")}</option>
      <option value="oldest">{t("sprintsIndex.oldest")}</option>
     </select>
    </div>
   </div>
   <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
    <span className="text-secondary small" role="status" aria-live="polite">
     {loading?t("sprintsIndex.loading"):t("sprintsIndex.total",{count:data?.total??0})}
    </span>
    <button type="button" className="btn btn-outline-secondary btn-sm"
     onClick={reload} disabled={loading}>{t("sprintStates.refresh")}</button>
   </div>
  </section>
  <section className="smn-panel rounded-4 p-3 p-md-4" aria-label={t("sprintsIndex.list")}>
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
      <Link href="/app/admin/sprints/tools#create-sprints" className="btn btn-outline-primary">
       {t("sprintsIndex.generate")}</Link>}
    </div>}
   {(!error&&items.length>0)&&<>
    <div className="table-responsive">
     <table className="table table-hover align-middle">
      <thead><tr>
       <th scope="col">{t("sprintStates.name")}</th>
       <th scope="col">{t("sprintsIndex.period")}</th>
       <th scope="col">{t("sprintStates.status")}</th>
       <th scope="col" className="text-end">{t("sprintsIndex.actions")}</th>
      </tr></thead>
      <tbody>{items.map(item=>{
       const current=item.status==="active"&&!item.suspended&&!item.stateMayBeStale;
       return <tr key={item.id} className={current?"table-active":""}>
        <th scope="row" className={current?"border-start border-primary border-4":""}>
         <span className="fw-semibold">{item.name}</span>
         {item.stateMayBeStale&&<small className="d-block text-warning-emphasis">
          {t("sprintsIndex.stateUnverified")}</small>}
        </th>
        <td><time dateTime={item.startAt}>{day(item.startAt,item.timeZone)}</time>
         {" — "}<time dateTime={item.endAt}>{day(item.endAt,item.timeZone)}</time></td>
        <td><span className={"badge "+(current?"text-bg-primary":"text-bg-secondary")}>
         {label(item)}</span></td>
        <td className="text-end">
         <div className="d-inline-flex gap-2 align-items-center">
          <button type="button" className="btn btn-sm btn-outline-secondary"
           title={t("sprintsIndex.calendarPending")} aria-label={t("sprintsIndex.calendarPending")}
           onClick={()=>setNotice(t("sprintsIndex.calendarPending"))}>▦</button>
          {canManage?<details className="d-inline-block text-start">
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
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
     <span className="small text-secondary">{t("sprintsIndex.page",{
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
  {canManage&&<p className="text-secondary small mb-0">
   {t("sprintsIndex.transitionNote")} <Link href="/app/admin/sprints/tools">
    {t("sprintsIndex.legacyTools")}</Link>
  </p>}
 </div>;
}
