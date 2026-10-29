"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Slots={morningStart:string;morningEnd:string;afternoonStart:string;afternoonEnd:string};
const EMPTY:Slots={morningStart:"",morningEnd:"",afternoonStart:"",afternoonEnd:""};
export default function WorkSlotsForm(){
 const t=useTranslation();const [slots,setSlots]=useState<Slots>(EMPTY),[zone,setZone]=useState("Europe/Paris"),[revision,setRevision]=useState(0),[teamId,setTeamId]=useState<string|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const [original,setOriginal]=useState<{slots:Slots;zone:string}|null>(null);
 const dirty=original!==null&&(JSON.stringify(slots)!==JSON.stringify(original.slots)||zone!==original.zone);
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 useEffect(()=>{fetch("/api/admin/sprints/work-slots",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.teamId)setTeamId(d.teamId);if(d.current){setSlots(d.current.slots);setZone(d.current.zone);setRevision(d.current.revision??0);setOriginal({slots:d.current.slots,zone:d.current.zone});}}).catch(()=>setMessage(t("epic4WorkSlots.error")));},[t]);
 async function save(){setBusy(true);setMessage("");try{
  const response=await fetch("/api/admin/sprints/work-slots",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...slots,timeZone:zone,revision,...(teamId?{teamId}:{})})});
  if(!response.ok)throw Error();setOriginal({slots:{...slots},zone});setRevision(n=>n+1);setMessage(t("epic4WorkSlots.saved"));
 }catch{setMessage(t("epic4WorkSlots.error"));}finally{setBusy(false);}}
 const fields=[["morningStart","morningStart"],["morningEnd","morningEnd"],["afternoonStart","afternoonStart"],["afternoonEnd","afternoonEnd"]] as const;
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("epic4WorkSlots.title")}</h2><p>{t("epic4WorkSlots.info")}</p>
 <div className="row g-2">{fields.map(([key,label])=><div className="col-6" key={key}><label className="form-label" htmlFor={"slot-"+key}>{t(({morningStart:"epic4WorkSlots.morningStart",morningEnd:"epic4WorkSlots.morningEnd",afternoonStart:"epic4WorkSlots.afternoonStart",afternoonEnd:"epic4WorkSlots.afternoonEnd"} as const)[label])}</label><input type="time" className="form-control" id={"slot-"+key} value={slots[key]} onChange={e=>setSlots(v=>({...v,[key]:e.target.value}))}/></div>)}</div>
 <label className="form-label mt-3" htmlFor="slot-zone">{t("epic4WorkSlots.zone")}</label><input className="form-control" id="slot-zone" value={zone} onChange={e=>setZone(e.target.value)} maxLength={80}/>
 <button type="button" className="btn btn-primary mt-3" disabled={busy||Object.values(slots).some(v=>!v)} onClick={save}>{t("epic4WorkSlots.save")}</button>
 {message&&<p role="status" className="mt-2">{message}</p>}
 </section>;
}
