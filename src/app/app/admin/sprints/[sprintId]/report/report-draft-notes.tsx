"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
const noteKeys=["introduction","conclusion","executive","objectives","indicators","events","attention","decisions"] as const;
type NoteKey=typeof noteKeys[number];
type Note={text:string;included:boolean;language:"fr"|"en"};
type Notes=Record<NoteKey,Note>;
const emptyNotes=():Notes=>Object.fromEntries(noteKeys.map(key=>[key,{text:"",included:true,language:"fr"}])) as Notes;
export default function ReportDraftNotes({sprintId}:{sprintId:string}){
 const t=useTranslation(),tr=(key:string)=>t(("reportNotes."+key) as Parameters<typeof t>[0]);
 const [notes,setNotes]=useState<Notes>(emptyNotes),[base,setBase]=useState(""),[revision,setRevision]=useState<number|null>(null);
 const [error,setError]=useState(false),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false);
 const dirty=revision!==null&&JSON.stringify(notes)!==base;
 useUnsavedChanges(dirty||busy,tr("leaveWarning"));
 useEffect(()=>{const ctrl=new AbortController();
 void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/notes",{cache:"no-store",signal:ctrl.signal})
 .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{notes:Notes;revision:number}>;})
 .then(v=>{if(!ctrl.signal.aborted){setNotes(v.notes);setBase(JSON.stringify(v.notes));setRevision(v.revision);}})
 .catch(()=>{if(!ctrl.signal.aborted)setError(true);});
 return()=>ctrl.abort();},[sprintId]);
 const update=(key:NoteKey,patch:Partial<Notes[NoteKey]>)=>{setNotes(v=>({...v,[key]:{...v[key],...patch}}));setSaved(false);};
 async function save(){if(revision===null||busy)return;setBusy(true);setError(false);
 try{const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/notes",{
 method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes,revision})});
 if(!r.ok)throw Error();const result=await r.json() as {revision:number};
 setRevision(result.revision);setBase(JSON.stringify(notes));setSaved(true);
 }catch{setError(true);}finally{setBusy(false);}}
 return <section className="border-top pt-4 d-grid gap-3"><h2 className="h5">{tr("heading")}</h2>
 <p className="text-body-secondary">{tr("intro")}</p>
 {noteKeys.map(key=><div className="border rounded p-3" key={key}>
 <label className="form-label fw-semibold" htmlFor={"note-"+key}>{key==="introduction"||key==="conclusion"?tr(key):t(("standardReport."+key) as "standardReport.executive")}</label>
 <textarea id={"note-"+key} className="form-control" rows={3} maxLength={5000} value={notes[key].text}
 disabled={revision===null||busy} onChange={e=>update(key,{text:e.target.value})}/>
 <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
 <label className="form-check"><input className="form-check-input" type="checkbox" checked={notes[key].included}
 disabled={revision===null||busy} onChange={e=>update(key,{included:e.target.checked})}/> <span className="form-check-label">{tr("include")}</span></label>
 <label>{tr("language")} <select className="form-select form-select-sm d-inline-block w-auto" value={notes[key].language}
 disabled={revision===null||busy} onChange={e=>update(key,{language:e.target.value as "fr"|"en"})}>
 <option value="fr">FR</option><option value="en">EN</option></select></label>
 </div>
 {notes[key].included&&notes[key].text.trim()&&<p className="small mt-2 mb-0">{notes[key].text}</p>}
 </div>)}
 <button className="btn btn-primary justify-self-start" type="button" disabled={!dirty||busy} onClick={()=>void save()}>{tr("save")}</button>
 {saved&&<p role="status" className="text-success">{tr("saved")}</p>}
 {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 </section>;
}
