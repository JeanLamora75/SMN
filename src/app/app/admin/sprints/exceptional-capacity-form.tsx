"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useEpic4Presentation} from "./i18n-presentation";
type Meeting={id:string;name:string;sprintId:string;impactsCapacity:boolean;status:string;sprintStatus:string;plannedMinutes:number;actualMinutes:number};
export default function ExceptionalCapacityForm(){
 const t=useTranslation();const presentation=useEpic4Presentation();const [items,setItems]=useState<Meeting[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function load(){setBusy(true);setError("");try{const r=await fetch("/api/admin/sprints/exceptional-capacity-impact",{cache:"no-store"});if(!r.ok)throw Error();setItems((await r.json()).meetings);}catch{setError(t("exceptionalCapacity.error"));}finally{setBusy(false);}}
 useEffect(()=>{void load();},[]);
 async function save(m:Meeting,value:boolean){setBusy(true);setError("");try{const r=await fetch("/api/admin/sprints/exceptional-capacity-impact",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:m.id,impactsCapacity:value})});if(!r.ok)throw Error();await load();}catch{setError(t("exceptionalCapacity.error"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("exceptionalCapacity.title")}</h2><p>{t("exceptionalCapacity.info")}</p>
 {items.map(m=><div className="d-flex align-items-center justify-content-between py-2 border-bottom" key={m.id}><div><strong>{m.name}</strong><div className="small text-secondary">{m.actualMinutes} min — {presentation.status(m.status)}</div></div>
 <label className="form-check-label"><input type="checkbox" className="form-check-input me-2" checked={m.impactsCapacity} disabled={busy||m.sprintStatus==="closed"} onChange={e=>save(m,e.target.checked)}/>{t("exceptionalCapacity.impact")}</label></div>)}
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}</section>;
}
