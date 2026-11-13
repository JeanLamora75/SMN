"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {jiraTicketUrl,normalizeJiraBaseUrl} from "@/lib/tickets/jira-links";
type Config={baseUrl:string|null;revision:number;updatedAt:string|null};
export default function JiraSettingsForm(){
 const t=useTranslation();
 const [saved,setSaved]=useState<Config|null>(null);
 const [url,setUrl]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const load=useCallback(async()=>{
  setError("");setSuccess("");
  try{
   const response=await fetch("/api/admin/tickets/jira-config",{cache:"no-store"});
   if(!response.ok)throw Error("unavailable");
   const json=await response.json() as {settings?:Config};
   if(!json.settings)throw Error("unavailable");
   setSaved(json.settings);setUrl(json.settings.baseUrl??"");
  }catch{setError(t("tickets.jiraSettingsLoadError"));}
 },[t]);
 useEffect(()=>{void Promise.resolve().then(load);},[load]);
 const normalized=url?normalizeJiraBaseUrl(url):null;
 const invalid=!!url&&!normalized;
 const dirty=!!saved&&(saved.baseUrl??"")!==(normalized??url);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!saved||invalid||busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/admin/tickets/jira-config",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({baseUrl:normalized,revision:saved.revision}),
   });
   const json=await response.json() as {settings?:Config;changed?:boolean;error?:string};
   if(!response.ok||!json.settings){
    setError(t(json.error==="conflict"?"tickets.jiraSettingsConflict":
     json.error==="invalid-input"?"tickets.jiraSettingsInvalid":"tickets.jiraSettingsSaveError"));
    return;
   }
   setSaved(json.settings);setUrl(json.settings.baseUrl??"");
   setSuccess(t(json.changed?"tickets.jiraSettingsSaved":"tickets.jiraSettingsUnchanged"));
  }catch{setError(t("tickets.jiraSettingsSaveError"));}
  finally{setBusy(false);}
 }
 const example=jiraTicketUrl(normalized,"ABC-123");
 return <form className="smn-panel p-4 d-grid gap-3" onSubmit={event=>void submit(event)}>
  <div>
   <label className="form-label fw-semibold" htmlFor="smn-jira-base-url">
    {t("tickets.jiraSettingsLabel")}
   </label>
   <input id="smn-jira-base-url" type="url" className="form-control"
    placeholder={t("tickets.jiraSettingsPlaceholder")} maxLength={2048}
    value={url} disabled={!saved||busy} aria-invalid={invalid}
    aria-describedby="smn-jira-url-help"
    onChange={event=>{setUrl(event.target.value);setSuccess("");setError("");}}/>
   <p id="smn-jira-url-help" className="small text-secondary mt-2 mb-0">{t("tickets.jiraSettingsHelp")}</p>
  </div>
  {invalid&&<p className="alert alert-warning" role="alert">{t("tickets.jiraSettingsInvalid")}</p>}
  <section className="smn-panel rounded-3 p-3">
   <h2 className="h6">{t("tickets.jiraSettingsPreview")}</h2>
   {example?<a href={example} target="_blank" rel="noopener noreferrer">{example}</a>:
    <p className="text-secondary mb-0">{t("tickets.jiraSettingsNoUrl")}</p>}
  </section>
  <div className="d-flex flex-wrap gap-2">
   <button type="submit" className="btn btn-primary" disabled={!saved||busy||invalid||!dirty}>
    {t(busy?"tickets.jiraSettingsSaving":"tickets.jiraSettingsSave")}
   </button>
   <button type="button" className="btn btn-outline-secondary" disabled={!saved||busy}
    onClick={()=>setUrl("")}>{t("tickets.jiraSettingsClear")}</button>
   <button type="button" className="btn btn-outline-secondary" disabled={busy}
    onClick={()=>void load()}>{t("tickets.jiraSettingsReload")}</button>
  </div>
  {error&&<p className="alert alert-danger" role="alert">{error}</p>}
  {success&&<p className="alert alert-success" role="status">{success}</p>}
 </form>;
}
