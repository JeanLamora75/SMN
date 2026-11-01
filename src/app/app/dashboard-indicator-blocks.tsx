"use client";
import "./dashboard-slot-cockpit.css";
import {useCallback,useEffect,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Indicator={id:string;tag:string;name:string;unit:string;value:string|null;state:"available"|"not-recorded"|"unavailable"};
type BlockKey="story_points"|"tickets"|"complementary";
type Block={key:BlockKey;positions:{index:number;indicator:Indicator|null}[]};
type Candidate={id:string;tag:string;name:string};
type Slot={block_key:BlockKey;slot_index:number;indicator_id:string};
type SlotSelection={block:BlockKey;index:number};
export default function DashboardIndicatorBlocks({teamId,cycleId,cycleType,locale}:{teamId:string;cycleId?:string;cycleType:"scrum"|"kanban";locale:"fr"|"en"}){
 const t=useTranslation();
 const [blocks,setBlocks]=useState<Block[]|null>(null),[error,setError]=useState(false);
 const [candidates,setCandidates]=useState<Candidate[]>([]),[slots,setSlots]=useState<Slot[]>([]);
 const [selected,setSelected]=useState<SlotSelection|null>(null),[choice,setChoice]=useState("");
 const [pickerError,setPickerError]=useState(""),[busy,setBusy]=useState(false),[pickerBusy,setPickerBusy]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const reload=useCallback(async(signal?:AbortSignal)=>{
  const response=await fetch("/api/admin/indicators/dashboard-cockpit?"+new URLSearchParams({teamId,cycleType,...(cycleId?{cycleId}:{})}),{cache:"no-store",signal});
  if(!response.ok)throw Error("unavailable");
  const data=await response.json() as {blocks:Block[]};
  if(!signal?.aborted){setBlocks(data.blocks);setError(false);}
 },[teamId,cycleType,cycleId]);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/indicators/dashboard-cockpit?"+new URLSearchParams({teamId,cycleType,...(cycleId?{cycleId}:{})}),{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<{blocks:Block[]}>;})
   .then(data=>{if(!controller.signal.aborted){setBlocks(data.blocks);setError(false);}})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return()=>controller.abort();
 },[teamId,cycleType,cycleId]);
 useEffect(()=>{
  if(!selected)return;
  const node=dialog.current;
  if(node&&!node.open)node.showModal();
  return()=>{if(node?.open)node.close();};
 },[selected]);
 const titles:Record<BlockKey,string>={story_points:t("dashboard.cockpit.storyPoints"),tickets:t("dashboard.cockpit.tickets"),complementary:t("indicators.dashboard.complementary")};
 const close=()=>{if(busy)return;setSelected(null);setChoice("");setPickerError("");};
 async function open(block:BlockKey,index:number,currentId:string|null){
  setPickerError("");setPickerBusy(true);
  setSelected({block,index});setChoice(currentId??"");
  try{
   const response=await fetch("/api/admin/indicators/dashboard-slots?"+new URLSearchParams({teamId}),{cache:"no-store"});
   if(!response.ok)throw Error("unavailable");
   const data=await response.json() as {slots:Slot[];candidates:Candidate[]};
   setSlots(data.slots);setCandidates(data.candidates);
   setChoice(data.slots.find(s=>s.block_key===block&&s.slot_index===index)?.indicator_id??"");
  }catch{setPickerError(t("indicators.reporting.unavailable"));}
  finally{setPickerBusy(false);}
 }
 async function save(){
  if(!selected||busy||pickerBusy)return;
  setBusy(true);setPickerError("");
  try{
   const response=await fetch("/api/admin/indicators/dashboard-slots",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({teamId,block:selected.block,position:selected.index,indicatorId:choice||null})
   });
   if(!response.ok)throw Error("unavailable");
   await reload();
   setSelected(null);setChoice("");
  }catch{setPickerError(t("indicators.reporting.unavailable"));}
  finally{setBusy(false);}
 }
 const occupiedByOther=(id:string)=>slots.some(s=>s.indicator_id===id&&!(s.block_key===selected?.block&&s.slot_index===selected?.index));
 return <>
  {error&&<p role="alert" className="alert alert-warning">{t("indicators.reporting.unavailable")}</p>}
  {!blocks&&!error&&<p role="status">{t("indicators.reporting.loading")}</p>}
  {blocks?.map(block=><article key={block.key} className="smn-metric-card smn-kpi-card p-3" aria-label={titles[block.key]}>
   <h2 className="smn-metric-title h6 mb-3">{titles[block.key]}</h2>
   <div className="row g-2">{block.positions.map(position=>{
    const v=position.indicator;
    return <div key={position.index} className="col-6">
     <div className="border rounded-3 bg-body p-2 text-center h-100 d-flex flex-column justify-content-between position-relative">
      <button type="button" className="btn btn-sm btn-outline-primary position-absolute top-0 end-0 m-1 d-inline-flex align-items-center justify-content-center" style={{width:25,height:25,padding:0,zIndex:1}} title={t("indicators.dashboard.configureSlot")} aria-label={t("indicators.dashboard.configureSlot")+" : "+titles[block.key]+" "+position.index} onClick={()=>void open(block.key,position.index,v?.id??null)}>+</button>
      {v?<><div className="small fw-medium pe-4">{v.name}</div>
       <div className="d-flex justify-content-center align-items-baseline gap-1 my-2">
        <span className="fs-4 fw-bold">{v.state==="available"&&v.value!==null?v.value.replace(".",locale==="fr"?",":"."):"—"}</span>
        {v.state==="available"&&v.unit&&<small className="text-secondary">{v.unit}</small>}
       </div><div className="small fw-bold">{v.tag}</div></>:
       <span className="small text-secondary my-auto py-3 pe-3">{t("indicators.dashboard.emptySlot")}</span>}
     </div>
    </div>;
   })}</div>
  </article>)}
  {selected&&<dialog ref={dialog} aria-modal="true" aria-labelledby="smn-slot-modal-title" onCancel={e=>{e.preventDefault();close();}} className="smn-dashboard-slot-dialog smn-sprint-edit-dialog">
   <div className="modal-content smn-indicator-dialog-content">
    <div className="modal-header smn-indicator-dialog-header"><h2 id="smn-slot-modal-title" className="h5 modal-title">{t("indicators.dashboard.configureSlot")}</h2><button type="button" className="btn-close" onClick={close} aria-label={t("indicators.input.close")}/></div>
    <div className="modal-body smn-indicator-dialog-form">
     <p className="text-secondary small">{titles[selected.block]} · {t("indicators.dashboard.position")} {selected.index}</p>
     {pickerError&&<p role="alert" className="alert alert-warning">{pickerError}</p>}
     <label className="form-label d-block">{t("indicators.reporting.indicator")}
      <select className="form-select mt-2" disabled={pickerBusy||busy||!!pickerError} value={choice} onChange={e=>setChoice(e.target.value)}>
       <option value="">{t("indicators.dashboard.none")}</option>
       {candidates.filter(c=>!occupiedByOther(c.id)).map(c=><option value={c.id} key={c.id}>{c.name} ({c.tag})</option>)}
      </select>
     </label>
    </div>
    <div className="modal-footer"><button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={close}>{t("indicators.cancel")}</button><button type="button" className="btn btn-primary" onClick={()=>void save()} disabled={busy||pickerBusy||!!pickerError}>{t("indicators.save")}</button></div>
   </div>
  </dialog>}
 </>;
}
