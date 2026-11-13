"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Slots={morningStart:string;morningEnd:string;afternoonStart:string;afternoonEnd:string};
const EMPTY:Slots={morningStart:"",morningEnd:"",afternoonStart:"",afternoonEnd:""};
export default function WorkSlotsForm({teams=[]}:{teams?:readonly {id:string;name:string}[]}){
 const t=useTranslation();const [slots,setSlots]=useState<Slots>(EMPTY),[zone,setZone]=useState("Europe/Paris"),[revision,setRevision]=useState(0),[teamId,setTeamId]=useState<string|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const [original,setOriginal]=useState<{slots:Slots;zone:string}|null>(null);
 const dirty=original!==null&&(JSON.stringify(slots)!==JSON.stringify(original.slots)||zone!==original.zone);
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 async function load(selectedTeamId:string|null=teamId){
  if(!selectedTeamId){setMessage(t("epic4WorkSlots.selectTeamRequired"));return;}
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/sprints/work-slots?teamId="+encodeURIComponent(selectedTeamId),{cache:"no-store"});
   if(!response.ok){const err=await response.json().catch(()=>({})) as {error?:string};
    setMessage(t(response.status===403?"epic4WorkSlots.forbidden":err.error==="team-context-unavailable"?"epic4WorkSlots.teamUnavailable":"epic4WorkSlots.loadError",{status:response.status}));return;}
   const data=await response.json() as {teamId?:string;current?:{slots:Slots;zone:string;revision:number}|null};
   if(!data.teamId){setMessage(t("epic4WorkSlots.teamUnavailable"));return;}
   setTeamId(data.teamId);
   if(data.current){
    setSlots(data.current.slots);setZone(data.current.zone);
    setRevision(data.current.revision);setOriginal({slots:data.current.slots,zone:data.current.zone});
   }else{setSlots(EMPTY);setRevision(0);setOriginal({slots:EMPTY,zone});}
  }catch{setMessage(t("epic4WorkSlots.networkError"));}
  finally{setBusy(false);}
 }
 useEffect(()=>{if(teams.length===1){setTeamId(teams[0].id);void Promise.resolve().then(()=>load(teams[0].id));}},[]);
 async function save(){
  if(!teamId){setMessage(t("epic4WorkSlots.selectTeamRequired"));return;}
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/sprints/work-slots",{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...slots,timeZone:zone,revision,teamId})
   });
   const result=await response.json().catch(()=>({})) as {ok?:boolean;error?:string};
   if(!response.ok||result.ok!==true){
    if(response.status===409||result.error==="conflict"){
     setMessage(t("epic4WorkSlots.conflict"));
    }else if(result.error==="invalid-input"||result.error==="invalid-zone"){
     setMessage(t("epic4WorkSlots.invalid"));
    }else{
     setMessage(t("epic4WorkSlots.saveError",{status:response.status}));
    }
    return;
   }
   setOriginal({slots:{...slots},zone});setRevision(n=>n+1);
   setMessage(t("epic4WorkSlots.saved"));
  }catch{setMessage(t("epic4WorkSlots.error"));}finally{setBusy(false);}
 }
 const fields=[["morningStart","morningStart"],["morningEnd","morningEnd"],["afternoonStart","afternoonStart"],["afternoonEnd","afternoonEnd"]] as const;
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("epic4WorkSlots.title")}</h2><p>{t("epic4WorkSlots.info")}</p>
 <div className="mb-3"><label className="form-label" htmlFor="slot-team">{t("epic4WorkSlots.team")}</label>
  <select className="form-select" id="slot-team" value={teamId??""} disabled={busy}
   onChange={e=>{const id=e.target.value||null;setTeamId(id);setOriginal(null);setSlots(EMPTY);setRevision(0);setMessage("");if(id)void load(id);}}>
   <option value="">{t("epic4WorkSlots.selectTeam")}</option>
   {teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}
  </select>
 </div>
 <div className="row g-2">{fields.map(([key,label])=><div className="col-6" key={key}><label className="form-label" htmlFor={"slot-"+key}>{t(({morningStart:"epic4WorkSlots.morningStart",morningEnd:"epic4WorkSlots.morningEnd",afternoonStart:"epic4WorkSlots.afternoonStart",afternoonEnd:"epic4WorkSlots.afternoonEnd"} as const)[label])}</label><input type="time" className="form-control" id={"slot-"+key} value={slots[key]} onChange={e=>setSlots(v=>({...v,[key]:e.target.value}))}/></div>)}</div>
 <label className="form-label mt-3" htmlFor="slot-zone">{t("epic4WorkSlots.zone")}</label><input className="form-control" id="slot-zone" value={zone} onChange={e=>setZone(e.target.value)} maxLength={80}/>
 <button type="button" className="btn btn-primary mt-3" disabled={busy||!teamId||!original||Object.values(slots).some(v=>!v)} onClick={save}>{t("epic4WorkSlots.save")}</button>
 <button type="button" className="btn btn-outline-secondary mt-3 ms-2" disabled={busy} onClick={()=>void load()}>{t("epic4WorkSlots.reload")}</button>
 {message&&<p role="alert" className="mt-2">{message}</p>}
 </section>;
}
