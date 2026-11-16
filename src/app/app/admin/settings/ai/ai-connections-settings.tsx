"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import BootstrapIcon from "../../../bootstrap-icon";
import LinkDialog from "../../../links/link-dialog";
import SettingsFilterPanel from "../settings-filter-panel";
type Provider="gemini"|"groq"|"openrouter";
type Connection={
 id:string;label:string;providerId:Provider;modelId:string|null;enabled:boolean;
 credentialState:"missing"|"configured"|"invalid";
 lastTestStatus:"never"|"passed"|"failed"|"quota"|"unavailable";
 lastTestAt:string|null;revision:number;
};
type FreeModel={providerId:Provider;modelId:string;expiresAt:string};
type FreeCatalog={qualified:FreeModel[];requiresManualQualification:boolean};
type Mutation={ok:boolean;id?:string;revision?:number;error?:string;cleanupPending?:boolean};
type Draft={label:string;providerId:Provider;modelId:string|null;key:string};
const initialDraft=():Draft=>({label:"",providerId:"gemini",modelId:null,key:""});
export default function AiConnectionsSettings(){
 const t=useTranslation();
 const [items,setItems]=useState<Connection[]>([]);
 const [freeCatalog,setFreeCatalog]=useState<FreeCatalog>({qualified:[],requiresManualQualification:true});
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [query,setQuery]=useState(""),[providerFilter,setProviderFilter]=useState("all");
 const [statusFilter,setStatusFilter]=useState("all");
 const [editing,setEditing]=useState<Connection|null|undefined>(undefined);
 const [draft,setDraft]=useState<Draft>(initialDraft());
 const [reveal,setReveal]=useState(false);
 const [pending,setPending]=useState<{connection:Connection;action:"delete"|"disable"|"remove"}|null>(null);
 const [checking,setChecking]=useState<string|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [connections,models]=await Promise.all([
    fetch("/api/admin/ai-connections",{cache:"no-store"}),
    fetch("/api/admin/ai-connections/free-models",{cache:"no-store"})
   ]);
   if(!connections.ok||!models.ok)throw Error("unavailable");
   const a=await connections.json() as {connections?:Connection[]};
   const b=await models.json() as FreeCatalog;
   if(!Array.isArray(a.connections)||!Array.isArray(b.qualified))throw Error("invalid");
   setItems(a.connections);setFreeCatalog(b);
  }catch{setError(t("aiConnections.loadError"));}
  finally{setLoading(false);}
 },[t]);
 useEffect(()=>{void load();},[load]);
 const shown=useMemo(()=>items.filter(item=>{
  const matchesSearch=[item.label,item.providerId,item.modelId??""].some(x=>
   x.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
  const matchesProvider=providerFilter==="all"||item.providerId===providerFilter;
  const matchesStatus=statusFilter==="all"||
   (statusFilter==="missing"&&item.credentialState==="missing")||
   (statusFilter==="configured"&&item.credentialState==="configured")||
   (statusFilter==="inactive"&&!item.enabled);
  return matchesSearch&&matchesProvider&&matchesStatus;
 }),[items,query,providerFilter,statusFilter]);
 const availableModels=freeCatalog.qualified.filter(m=>m.providerId===draft.providerId);
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(busy||!draft.label.trim()||!draft.providerId)return;
  setBusy(true);setError("");setNotice("");
  try{
   const isEditing=editing!==null&&editing!==undefined;
   const changedProvider=isEditing&&draft.providerId!==editing.providerId;
   const changedModel=isEditing&&draft.modelId!==editing.modelId;
   const shouldChangeMetadata=!isEditing||draft.label.trim()!==editing.label||
    changedProvider||changedModel;
   if(isEditing&&shouldChangeMetadata&&editing.credentialState==="configured"&&!draft.key){
    setError(t("aiConnections.keyReplaceHelp"));return;
   }
   const payload=isEditing
    ?{action:"update",id:editing.id,revision:editing.revision,label:draft.label,
      providerId:draft.providerId,modelId:draft.modelId}
    :{action:"create",label:draft.label,providerId:draft.providerId,modelId:draft.modelId};
   // If only the key is changing, keep the registry revision and avoid
   // needlessly invalidating the existing encrypted credential.
   let id=isEditing?editing.id:"",revision=isEditing?editing.revision:0;
   if(shouldChangeMetadata){
    const response=await fetch("/api/admin/ai-connections",{
     method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await response.json() as Mutation;
    if(!response.ok||!data.ok||!data.id||!data.revision)
     throw Error(data.error==="conflict-or-not-found"?"conflict":"save");
    id=data.id;revision=data.revision;
   }
   if(draft.key){
    const response=await fetch("/api/admin/ai-connections/credentials",{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({action:"replace",id,revision,key:draft.key})});
    const result=await response.json() as Mutation;
    if(!response.ok||!result.ok)throw Error(result.error==="conflict-or-not-found"?"conflict":"key");
    setNotice(t("aiConnections.keySaved"));
   }else setNotice(t("aiConnections.saved"));
   setDraft(initialDraft());setReveal(false);setEditing(undefined);
   await load();
  }catch(e){
   setError(t(e instanceof Error&&e.message==="conflict"?
    "aiConnections.conflict":e instanceof Error&&e.message==="key"?
     "aiConnections.keyError":"aiConnections.saveError"));
  }finally{setBusy(false);}
 };
 const mutate=async()=>{
  if(!pending||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const {connection,action}=pending;
   const endpoint=action==="remove"?"/api/admin/ai-connections/credentials":"/api/admin/ai-connections";
   const payload=action==="remove"?{action:"remove",id:connection.id,revision:connection.revision}:
    {action,id:connection.id,revision:connection.revision};
   const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)});
   const body=await result.json() as Mutation;
   if(!result.ok||!body.ok)throw Error(body.error==="conflict-or-not-found"?"conflict":"save");
   setPending(null);
   setNotice(t(action==="remove"?"aiConnections.removed":
    action==="delete"?"aiConnections.deleted":"aiConnections.disabled"));
   await load();
  }catch(e){setError(t(e instanceof Error&&e.message==="conflict"?
   "aiConnections.conflict":"aiConnections.saveError"));}
  finally{setBusy(false);}
 };
 const verifyLocal=async(item:Connection)=>{
  if(checking||busy)return;
  setChecking(item.id);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin/ai-connections/local-check?id="+encodeURIComponent(item.id),{cache:"no-store"});
   if(!response.ok)throw Error("unavailable");
   const result=await response.json() as {localStatus:"missing"|"present";apiTested:false};
   setNotice(t(result.localStatus==="present"?"aiConnections.localOk":"aiConnections.localMissing"));
  }catch{setError(t("aiConnections.localError"));}
  finally{setChecking(null);}
 };
 const open=(item:Connection|null)=>{
  setDraft(item?{label:item.label,providerId:item.providerId,modelId:item.modelId,key:""}:initialDraft());
  setEditing(item);setReveal(false);setError("");setNotice("");
 };
 const status=(item:Connection)=>{
  if(item.credentialState==="missing")return t("aiConnections.statusMissing");
  if(item.credentialState==="invalid")return t("aiConnections.statusInvalid");
  if(!item.enabled)return t("aiConnections.statusReady");
  return t("aiConnections.statusUntested");
 };
 return <div className="d-grid gap-4">
  <section className="smn-panel p-3 p-md-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
   <div>
    <h2 className="h5 mb-1">{t("aiConnections.table")}</h2>
    <p className="small text-secondary mb-0">{t("aiConnections.freeOnly")}</p>
   </div>
   <button type="button" className="btn btn-primary" onClick={()=>open(null)} disabled={busy}>
    <BootstrapIcon name="plus-lg"/> {t("aiConnections.add")}
   </button>
  </section>
  <SettingsFilterPanel title={t("aiConnections.filters")}>
   <div className="d-flex gap-3 flex-wrap align-items-end">
    <div className="flex-grow-1" style={{minWidth:220}}>
     <label htmlFor="smn-ai-search" className="form-label">{t("aiConnections.search")}</label>
     <input id="smn-ai-search" type="search" className="form-control" value={query}
      onChange={e=>setQuery(e.target.value)}/>
    </div>
    <div>
     <label htmlFor="smn-ai-provider-filter" className="form-label">{t("aiConnections.provider")}</label>
     <select id="smn-ai-provider-filter" className="form-select" value={providerFilter}
      onChange={e=>setProviderFilter(e.target.value)}>
      <option value="all">{t("aiConnections.allProviders")}</option>
      {(["gemini","groq","openrouter"] as const).map(p=><option key={p} value={p}>{p}</option>)}
     </select>
    </div>
    <div>
     <label htmlFor="smn-ai-status-filter" className="form-label">{t("aiConnections.status")}</label>
     <select id="smn-ai-status-filter" className="form-select" value={statusFilter}
      onChange={e=>setStatusFilter(e.target.value)}>
      <option value="all">{t("aiConnections.allStatuses")}</option>
      <option value="missing">{t("aiConnections.statusMissing")}</option>
      <option value="configured">{t("aiConnections.statusReady")}</option>
      <option value="inactive">{t("aiConnections.statusInactive")}</option>
     </select>
    </div>
   </div>
  </SettingsFilterPanel>
  <section className="smn-panel p-3 p-md-4" aria-label={t("aiConnections.table")}>
   <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
    <h2 className="h5 mb-0">{t("aiConnections.table")}</h2>
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>void load()} disabled={loading||busy}>
     {t("aiConnections.reload")}
    </button>
   </div>
   {loading?<p role="status" className="text-secondary">{t("aiConnections.reload")}…</p>:
    shown.length===0?<p className="text-secondary">{items.length?t("aiConnections.noResults"):t("aiConnections.none")}</p>:
    <div className="table-responsive"><table className="table align-middle">
     <thead><tr><th scope="col">{t("aiConnections.name")}</th><th scope="col">{t("aiConnections.provider")}</th>
      <th scope="col">{t("aiConnections.model")}</th><th scope="col">{t("aiConnections.status")}</th>
      <th scope="col">{t("aiConnections.actions")}</th></tr></thead>
     <tbody>{shown.map(item=><tr key={item.id}>
      <td className="fw-semibold">{item.label}</td><td>{item.providerId}</td>
      <td>{item.modelId??t("aiConnections.modelPending")}</td>
      <td><span className="small">{status(item)}</span></td>
      <td><div className="d-flex flex-wrap gap-1">
       <button type="button" className="btn btn-outline-secondary btn-sm"
        aria-label={t("aiConnections.edit")} title={t("aiConnections.edit")}
        disabled={busy} onClick={()=>open(item)}><BootstrapIcon name="pencil-square"/></button>
       <button type="button" className="btn btn-outline-secondary btn-sm"
        aria-label={t("aiConnections.checkLocal")} title={t("aiConnections.checkLocal")}
        disabled={busy||checking===item.id} onClick={()=>void verifyLocal(item)}>
        <BootstrapIcon name="search"/></button>
       <button type="button" className="btn btn-outline-secondary btn-sm"
        aria-label={t("aiConnections.remoteTest")} title={t("aiConnections.remoteUnavailable")}
        disabled><BootstrapIcon name="chat-dots"/></button>
       <button type="button" className="btn btn-outline-secondary btn-sm"
        aria-label={t("aiConnections.removeKey")} title={t("aiConnections.removeKey")}
        disabled={busy||item.credentialState!=="configured"}
        onClick={()=>setPending({connection:item,action:"remove"})}><BootstrapIcon name="tag"/></button>
       <button type="button" className="btn btn-outline-secondary btn-sm"
        aria-label={t("aiConnections.disable")} title={t("aiConnections.disable")}
        disabled={busy||!item.enabled}
        onClick={()=>setPending({connection:item,action:"disable"})}><BootstrapIcon name="sliders"/></button>
       <button type="button" className="btn btn-outline-danger btn-sm"
        aria-label={t("aiConnections.delete")} title={t("aiConnections.delete")}
        disabled={busy} onClick={()=>setPending({connection:item,action:"delete"})}>
        <BootstrapIcon name="trash-fill"/></button>
      </div></td>
     </tr>)}</tbody>
    </table></div>}
  </section>
  <div className="alert alert-info mb-0" role="status">
   {t("aiConnections.statusWaiting")} — {t("aiConnections.remoteLater")}
  </div>
  <p className="small text-secondary mb-0">{t("aiConnections.limitNotice")}</p>
  {error&&<p className="alert alert-danger mb-0" role="alert">{error}</p>}
  {notice&&<p className="alert alert-success mb-0" role="status">{notice}</p>}
  {editing!==undefined&&<LinkDialog titleId="smn-ai-modal-title" locked={busy}
   cockpit onClose={()=>{setEditing(undefined);setDraft(initialDraft());}}>
   <form onSubmit={e=>void submit(e)}>
    <div className="modal-header">
     <h2 className="modal-title fs-5" id="smn-ai-modal-title">{t(editing?"aiConnections.edit":"aiConnections.create")}</h2>
     <button type="button" className="btn-close" aria-label={t("aiConnections.cancel")}
      disabled={busy} onClick={()=>setEditing(undefined)}/>
    </div>
    <div className="modal-body d-grid gap-3">
     <div><label className="form-label" htmlFor="smn-ai-label">{t("aiConnections.label")}</label>
      <input required id="smn-ai-label" className="form-control" maxLength={120}
       value={draft.label} disabled={busy} onChange={e=>setDraft(d=>({...d,label:e.target.value}))}/></div>
     <div><label className="form-label" htmlFor="smn-ai-provider">{t("aiConnections.provider")}</label>
      <select id="smn-ai-provider" className="form-select" disabled={busy} value={draft.providerId}
       onChange={e=>setDraft(d=>({...d,providerId:e.target.value as Provider,modelId:null}))}>
       {(["gemini","groq","openrouter"] as const).map(p=><option key={p} value={p}>{p}</option>)}
      </select></div>
     <div><label htmlFor="smn-ai-model" className="form-label">{t("aiConnections.model")}</label>
      <select id="smn-ai-model" className="form-select" value={draft.modelId??""}
       disabled={busy||availableModels.length===0}
       onChange={e=>setDraft(d=>({...d,modelId:e.target.value||null}))}>
       <option value="">{t("aiConnections.modelPending")}</option>
       {availableModels.map(m=><option key={m.modelId} value={m.modelId}>{m.modelId}</option>)}
      </select><p className="small text-secondary mt-1 mb-0">{t("aiConnections.modelHelp")}</p></div>
     <div>
      <label htmlFor="smn-ai-key" className="form-label">{t(editing?"aiConnections.keyReplace":"aiConnections.key")}</label>
      <div className="input-group"><input id="smn-ai-key" type={reveal?"text":"password"}
       autoComplete="new-password" spellCheck={false} className="form-control"
       value={draft.key} minLength={8} maxLength={8192} disabled={busy}
       onChange={e=>setDraft(d=>({...d,key:e.target.value}))}/>
       <button type="button" className="btn btn-outline-secondary" disabled={busy}
        onClick={()=>setReveal(x=>!x)}>{t(reveal?"aiConnections.hideKey":"aiConnections.showKey")}</button>
      </div>
      <p className="small text-secondary mt-1 mb-0">{t(editing?"aiConnections.keyReplaceHelp":"aiConnections.newKeyHelp")}</p>
      <p className="small text-secondary mb-0">{t("aiConnections.keyNotReturned")}</p>
     </div>
     {error&&<div role="alert" className="alert alert-danger">{error}</div>}
    </div>
    <div className="modal-footer">
     <button type="button" className="btn btn-outline-secondary" disabled={busy}
      onClick={()=>{setEditing(undefined);setDraft(initialDraft());}}>{t("aiConnections.cancel")}</button>
     <button type="submit" className="btn btn-primary" disabled={busy||!draft.label.trim()}>
      {t("aiConnections.save")}</button>
    </div>
   </form>
  </LinkDialog>}
  {pending&&<LinkDialog titleId="smn-ai-confirm-title" locked={busy} cockpit
   onClose={()=>setPending(null)}>
   <div className="modal-header">
    <h2 id="smn-ai-confirm-title" className="modal-title fs-5">{pending.connection.label}</h2>
    <button type="button" className="btn-close" aria-label={t("aiConnections.cancel")}
     disabled={busy} onClick={()=>setPending(null)}/>
   </div>
   <div className="modal-body"><p>{t(pending.action==="delete"?"aiConnections.confirmDelete":
    pending.action==="remove"?"aiConnections.confirmRemove":"aiConnections.confirmDisable")}</p></div>
   <div className="modal-footer">
    <button type="button" className="btn btn-outline-secondary" disabled={busy}
     onClick={()=>setPending(null)}>{t("aiConnections.cancel")}</button>
    <button type="button" className="btn btn-danger" disabled={busy}
     onClick={()=>void mutate()}>{t("aiConnections.confirm")}</button>
   </div>
  </LinkDialog>}
 </div>;
}
