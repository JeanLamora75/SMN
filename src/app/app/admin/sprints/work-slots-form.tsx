"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Slots={morningStart:string;morningEnd:string;afternoonStart:string;afternoonEnd:string};
const EMPTY:Slots={morningStart:"",morningEnd:"",afternoonStart:"",afternoonEnd:""};
export default function WorkSlotsForm(){
 const t=useTranslation();const [slots,setSlots]=useState<Slots>(EMPTY),[zone,setZone]=useState("Europe/Paris"),[revision,setRevision]=useState(0),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch("/api/admin/sprints/work-slots",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.current){setSlots(d.current.slots);setZone(d.current.zone);setRevision(d.current.revision??0);}}).catch(()=>setMessage(t("epic4WorkSlots.error")));},[t]);
 async function save(){setBusy(true);setMessage("");try{
  const response=await fetch("/api/admin/sprints/work-slots",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...slots,timeZone:zone,revision})});
  if(!response.ok)throw Error();setRevision(n=>n+1);setMessage(t("epic4WorkSlots.saved"));
 }catch{setMessage(t("epic4WorkSlots.error"));}finally{setBusy(false);}}
 const fields=[["morningStart","morningStart"],["morningEnd","morningEnd"],["afternoonStart","afternoonStart"],["afternoonEnd","afternoonEnd"]] as const;
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("epic4WorkSlots.title")}</h2><p>{t("epic4WorkSlots.info")}</p>
 <div className="row g-2">{fields.map(([key,label])=><div className="col-6" key={key}><label className="form-label" htmlFor={"slot-"+key}>{t("epic4WorkSlots."+label)}</label><input type="time" className="form-control" id={"slot-"+key} value={slots[key]} onChange={e=>setSlots(v=>({...v,[key]:e.target.value}))}/></div>)}</div>
 <label className="form-label mt-3" htmlFor="slot-zone">{t("epic4WorkSlots.zone")}</label><input className="form-control" id="slot-zone" value={zone} onChange={e=>setZone(e.target.value)} maxLength={80}/>
 <button type="button" className="btn btn-primary mt-3" disabled={busy||Object.values(slots).some(v=>!v)} onClick={save}>{t("epic4WorkSlots.save")}</button>
 {message&&<p role="status" className="mt-2">{message}</p>}
 </section>;
}
