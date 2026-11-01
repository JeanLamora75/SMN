"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Indicator={id:string;tag:string;name:string;unit:string;value:string|null;state:"available"|"not-recorded"|"unavailable"};
type Block={key:"story_points"|"tickets"|"complementary";positions:{index:number;indicator:Indicator|null}[]};
export default function DashboardIndicatorBlocks({teamId,cycleId,cycleType,locale}:{teamId:string;cycleId?:string;cycleType:"scrum"|"kanban";locale:"fr"|"en"}){
 const t=useTranslation(),[blocks,setBlocks]=useState<Block[]|null>(null),[error,setError]=useState(false);
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/indicators/dashboard-cockpit?"+new URLSearchParams({teamId,cycleType,...(cycleId?{cycleId}:{})}),{cache:"no-store",signal:ctrl.signal})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<{blocks:Block[]}>})
   .then(r=>{if(!ctrl.signal.aborted){setBlocks(r.blocks);setError(false);}})
   .catch(()=>{if(!ctrl.signal.aborted)setError(true);});
  return()=>ctrl.abort();
 },[teamId,cycleType,cycleId]);
 const titles:Record<Block["key"],string>={story_points:t("dashboard.cockpit.storyPoints"),tickets:t("dashboard.cockpit.tickets"),complementary:t("indicators.dashboard.complementary")};
 return <>
  {error&&<p role="alert" className="alert alert-warning">{t("indicators.reporting.unavailable")}</p>}
  {!blocks&&!error&&<p role="status">{t("indicators.reporting.loading")}</p>}
  {blocks?.map(block=><article key={block.key} className="smn-metric-card smn-kpi-card p-3" aria-label={titles[block.key]}>
   <h2 className="smn-metric-title h6 mb-3">{titles[block.key]}</h2>
   <div className="row g-2">
    {block.positions.map(position=>{
     const v=position.indicator;
     return <div key={position.index} className="col-6">
      <div className="border rounded-3 bg-body p-2 text-center h-100 d-flex flex-column justify-content-between">
       {v?<><div className="small fw-medium">{v.name}</div>
        <div className="d-flex justify-content-center align-items-baseline gap-1 my-2">
         <span className="fs-4 fw-bold">{v.state==="available"&&v.value!==null?v.value.replace(".",locale==="fr"?",":"."):"—"}</span>
         {v.state==="available"&&v.unit&&<small className="text-secondary">{v.unit}</small>}
        </div><div className="small fw-bold">{v.tag}</div></>:
        <span className="small text-secondary my-auto py-3">{t("indicators.dashboard.emptySlot")}</span>}
      </div>
     </div>;
    })}
   </div>
  </article>)}
 </>;
}
