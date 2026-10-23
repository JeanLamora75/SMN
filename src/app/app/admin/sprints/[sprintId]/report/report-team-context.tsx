"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {teamContextKeys,defaultTeamContextOptions,selectedTeamContext,type TeamContextSources,type TeamContextOptions} from "@/lib/report-team-context";
export default function ReportTeamContext({sprintId}:{sprintId:string}){
 const t=useTranslation(),tr=(key:string)=>t(("reportTeamContext."+key) as Parameters<typeof t>[0]);
 const [sources,setSources]=useState<TeamContextSources|null>(null),[options,setOptions]=useState<TeamContextOptions>(defaultTeamContextOptions);
 const [base,setBase]=useState(""),[revision,setRevision]=useState<number|null>(null);
 const [error,setError]=useState(false),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);
 const dirty=revision!==null&&JSON.stringify(options)!==base;
 useUnsavedChanges(dirty||busy,tr("leaveWarning"));
 useEffect(()=>{const ctrl=new AbortController();
 void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/team-context",{signal:ctrl.signal,cache:"no-store"})
 .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{sources:TeamContextSources;options:TeamContextOptions;revision:number}>;})
 .then(data=>{if(!ctrl.signal.aborted){setSources(data.sources);setOptions(data.options);setBase(JSON.stringify(data.options));setRevision(data.revision);}})
 .catch(()=>{if(!ctrl.signal.aborted)setError(true);});return()=>ctrl.abort();},[sprintId]);
 async function save(){if(revision===null||busy)return;setBusy(true);setError(false);
 try{const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/team-context",{
 method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision,options})});
 if(!r.ok)throw Error();const data=await r.json() as {revision:number};
 setRevision(data.revision);setBase(JSON.stringify(options));setSaved(true);
 }catch{setError(true);}finally{setBusy(false);}}
 return <section className="border-top pt-3">
 <h2 className="h5">{tr("heading")}</h2><p className="text-secondary">{tr("intro")}</p>
 {teamContextKeys.map(key=><div className="form-check my-2" key={key}>
 <label className="form-check-label"><input className="form-check-input" type="checkbox" checked={options[key]}
 disabled={revision===null||busy||!sources?.[key]}
 onChange={e=>{setSaved(false);setOptions(o=>({...o,[key]:e.target.checked}));}}/> {tr(key)}</label>
 {!sources?.[key]&&<span className="ms-2 small text-secondary">{tr("unavailable")}</span>}
 </div>)}
 <button type="button" className="btn btn-primary my-2" disabled={!dirty||busy} onClick={()=>void save()}>{tr("save")}</button>
 {saved&&<p className="text-success" role="status">{tr("saved")}</p>}
 {error&&<p className="text-danger" role="alert">{tr("error")}</p>}
 <h3 className="h6 mt-3">{tr("preview")}</h3>
 {sources&&selectedTeamContext(sources,options).map(entry=><article key={entry.key} className="border rounded p-2 mb-2">
 <strong>{tr(entry.key)}</strong>
 {entry.kind==="url"?<p><a href={entry.value} target="_blank" rel="noopener noreferrer">{entry.value}</a> <small>{tr("unverified")}</small></p>:
 <p style={{whiteSpace:"pre-wrap"}}>{entry.value}</p>}
 {entry.language&&<small>{tr("language")}: {entry.language}</small>}
 </article>)}
 </section>;
}
