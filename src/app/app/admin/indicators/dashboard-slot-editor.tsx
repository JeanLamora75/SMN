"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import type {DashboardBlockKey} from "@/server/indicators/dashboard-slots";
type Slot={block_key:DashboardBlockKey;slot_index:number;indicator_id:string};
type Definition={id:string;tag:string;name:string;archived_at:string|null};
const BLOCKS=[{key:"story_points" as const,count:4},{key:"tickets" as const,count:2},{key:"complementary" as const,count:2}];
export default function DashboardSlotEditor({teamId,definitions}:{teamId:string;definitions:Definition[]}){
 const t=useTranslation(),[slots,setSlots]=useState<Slot[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  if(!teamId)return;
  const ctrl=new AbortController();
  void fetch("/api/admin/indicators/dashboard-slots?"+new URLSearchParams({teamId}),{signal:ctrl.signal,cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<{slots:Slot[]}>})
   .then(r=>{if(!ctrl.signal.aborted){setSlots(r.slots);setError("");}})
   .catch(()=>{if(!ctrl.signal.aborted)setError("unavailable");});
  return()=>ctrl.abort();
 },[teamId]);
 async function assign(block:DashboardBlockKey,position:number,id:string){
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/indicators/dashboard-slots",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({teamId,block,position,indicatorId:id||null})});
   const data=await r.json() as {error?:string};
   if(!r.ok)throw Error(data.error??"unavailable");
   const fresh=await fetch("/api/admin/indicators/dashboard-slots?"+new URLSearchParams({teamId}),{cache:"no-store"});
   if(!fresh.ok)throw Error("unavailable");
   const payload=await fresh.json() as {slots:Slot[]};
   setSlots(payload.slots);
  }catch(e){setError(e instanceof Error?e.message:"unavailable");}
  finally{setBusy(false);}
 }
 return <section className="border rounded-3 p-3 mb-3" aria-label={t("indicators.screen.dashboard")}>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {BLOCKS.map(block=><div key={block.key} className="mb-3">
   <h3 className="h6">{block.key==="story_points"?t("dashboard.cockpit.storyPoints"):block.key==="tickets"?t("dashboard.cockpit.tickets"):t("indicators.dashboard.complementary")}</h3>
   <div className="row g-2">{Array.from({length:block.count},(_,i)=>{
    const pos=i+1,selected=slots.find(s=>s.block_key===block.key&&s.slot_index===pos)?.indicator_id??"";
    return <label className="col-md-6 form-label" key={pos}>{t("indicators.dashboard.position")} {pos}
     <select className="form-select" value={selected} disabled={!teamId||busy} onChange={e=>void assign(block.key,pos,e.target.value)}>
      <option value="">{t("indicators.dashboard.none")}</option>
      {definitions.filter(d=>!d.archived_at&&(!slots.some(s=>s.indicator_id===d.id)||selected===d.id)).map(d=><option key={d.id} value={d.id}>{d.tag} — {d.name}</option>)}
     </select>
    </label>;
   })}</div>
  </div>)}
 </section>;
}
