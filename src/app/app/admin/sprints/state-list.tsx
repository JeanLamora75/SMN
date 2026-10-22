"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useEpic4Presentation} from "./i18n-presentation";
type State={id:string;name:string;status:string;suspended:boolean;startAt:string;endAt:string};
export default function SprintStateList(){
 const t=useTranslation();const presentation=useEpic4Presentation();
 const [rows,setRows]=useState<State[]>([]);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 async function reload(){setLoading(true);setError("");
 try{const r=await fetch("/api/admin/sprints/states",{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();setRows(d.sprints);}
 catch{setError(t("sprintStates.error"));}finally{setLoading(false);}}
 useEffect(()=>{void reload();},[]);
 const label=(s:State)=>s.suspended?t("sprintStates.suspended"):s.status==="planned"?t("sprintStates.planned"):s.status==="active"?t("sprintStates.active"):s.status==="finished"?t("sprintStates.finished"):s.status==="closed"?t("sprintStates.closed"):s.status;
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("sprintStates.title")}</h2><p>{t("sprintStates.intro")}</p>
 <button type="button" className="btn btn-outline-primary mb-3" disabled={loading} onClick={reload}>{t("sprintStates.refresh")}</button>
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}
 <div className="table-responsive"><table className="table"><thead><tr><th>{t("sprintStates.name")}</th><th>{t("sprintStates.status")}</th><th>{t("sprintStates.range")}</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td>{s.name}</td><td>{label(s)}</td><td>{presentation.date(s.startAt)} → {presentation.date(s.endAt)}</td></tr>)}</tbody></table></div>
 </section>;
}
