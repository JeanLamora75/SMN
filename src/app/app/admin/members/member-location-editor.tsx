"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {prefillValue} from "@/lib/form-prefill";

type Location={revision:number;effectiveFrom:string;countryIso2:string|null;
 region:string|null;city:string|null;timeZone:string|null;source:"manual"|"installation-default"};
type Version={revision:number;effective_from:string;country_iso2:string|null;
 region:string|null;city:string|null;time_zone:string|null;source:"manual"|"installation-default"};
type Preview={utc:string;timeZone:string;label:string;
 parts:{year:string;month:string;day:string;hour:string;minute:string}};
type State={memberId:string;teamId:string;archived:boolean;today:string;
 suggestedCountryIso2:string|null;configured:boolean;current:Location|null;
 effective:Location|null;versions:Version[];requestedOn:string;
 display:Preview|null;holidayCalendarScope:"national-only";
 regionalHolidayAuto:false;holidayDataAvailable:false};
type Draft={countryIso2:string;region:string;city:string;timeZone:string;effectiveFrom:string};
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const isoInstant=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export function newDraft(data:State):Draft{
 const latest=data.versions.at(-1);
 const country=prefillValue(latest?.country_iso2,
  data.suggestedCountryIso2,"",Boolean(latest));
 return {countryIso2:country.value,
  region:latest?.region??"",city:latest?.city??"",timeZone:latest?.time_zone??"",
  effectiveFrom:latest&&latest.effective_from>data.today?latest.effective_from:data.today};
}
export default function MemberLocationEditor({memberId,teamName,onClose}:{
 memberId:string;teamName:string;onClose:()=>void;
}){
 const t=useTranslation();
 const [data,setData]=useState<State|null>(null);
 const [catalog,setCatalog]=useState<{code:string;name:string}[]>([]);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [draft,setDraft]=useState<Draft|null>(null);
 const [baseline,setBaseline]=useState("");
 const [onDate,setOnDate]=useState("");
 const [history,setHistory]=useState<Location|null>(null);
 const [historyViewed,setHistoryViewed]=useState(false);
 const [eventUtc,setEventUtc]=useState("2027-03-28T01:30:00Z");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const dirty=Boolean(draft&&JSON.stringify(draft)!==baseline);
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 async function fetchState(){
  const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/location",
   {cache:"no-store"});
  if(!response.ok)throw Error("failed-read");
  const next=await response.json() as State;
  if(next.memberId!==memberId||!Array.isArray(next.versions))throw Error("invalid-response");
  setData(next);setStatus("ready");
  const initial=newDraft(next);
  setDraft(initial);setBaseline(JSON.stringify(initial));
  setOnDate(next.today);setHistory(next.current);setHistoryViewed(false);setPreview(null);
  return next;
 }
 useEffect(()=>{
  void fetch("/api/admin/countries",{cache:"no-store"}).then(async r=>r.ok?r.json():null)
   .then((v:{countries?:{code:string;name:string}[]}|null)=>setCatalog(v?.countries??[]))
   .catch(()=>undefined);
 },[]);
 useEffect(()=>{
  let live=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/location",{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("read");return r.json() as Promise<State>;})
   .then(next=>{
    if(!live)return;
    if(next.memberId!==memberId||!Array.isArray(next.versions))throw Error("invalid");
    setData(next);setStatus("ready");
    const initial=newDraft(next);
    // Never replace a local change when an older context read finishes later.
    setDraft(current=>current??initial);setBaseline(JSON.stringify(initial));
    setOnDate(next.today);setHistory(next.current);
   }).catch(()=>{if(live)setStatus("error");});
  return ()=>{live=false;};
 },[memberId]);
 const change=(key:keyof Draft,value:string)=>setDraft(d=>d?{...d,[key]:value}:d);
 const close=()=>{
  if(busy)return;
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  onClose();
 };
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!data||!draft||busy)return;
  setMessage("");setError("");
  const country=draft.countryIso2.trim().toUpperCase();
  if(country&&!/^[A-Z]{2}$/.test(country)){
   setError(t("members.location.invalidCountry"));return;
  }
  if(draft.timeZone.length>128||draft.city.length>120||draft.region.length>120||
   !datePattern.test(draft.effectiveFrom)){
   setError(t("members.location.invalidInput"));return;
  }
  setBusy(true);
  try{
   const result=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/location",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({countryIso2:country||null,region:draft.region.trim()||null,
     city:draft.city.trim()||null,timeZone:draft.timeZone.trim()||null,
     effectiveFrom:draft.effectiveFrom,revision:data.versions.at(-1)?.revision??0})
   });
   if(!result.ok){
    const payload=await result.json() as {error?:string};
    setError(t(payload.error==="conflict"?"members.location.conflict":
     payload.error==="date-in-past"||payload.error==="date-before-latest"?
      "members.location.invalidDate":
     payload.error==="archived"?"members.location.archived":
     "members.location.invalidInput"));
    return;
   }
   await fetchState();setMessage(t("members.location.saved"));
  }catch{setError(t("members.location.failed"));}
  finally{setBusy(false);}
 }
 async function historical(){
  if(!data||!datePattern.test(onDate))return;
  setError("");setHistoryViewed(false);
  try{
   const r=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+
    "/location?onDate="+encodeURIComponent(onDate),{cache:"no-store"});
   if(!r.ok)throw Error("read");
   const value=await r.json() as State;
   setHistory(value.effective);setHistoryViewed(true);
  }catch{setError(t("members.location.failedLoad"));}
 }
 async function convertEvent(){
  if(!isoInstant.test(eventUtc)){setError(t("members.location.invalidInstant"));return;}
  setError("");setPreview(null);
  try{
   const r=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+
    "/location?at="+encodeURIComponent(eventUtc),{cache:"no-store"});
   if(!r.ok)throw Error("read");
   const value=await r.json() as State;
   setPreview(value.display);
   if(!value.display)setMessage(t("members.location.missingZone"));
  }catch{setError(t("members.location.invalidInstant"));}
 }
 const version=data?.versions.at(-1);
 const earliest=version&&version.effective_from>data!.today?version.effective_from:data?.today;
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="member-location-title">
  <h3 className="h5" id="member-location-title">{t("members.location.title")}</h3>
  {status==="loading"&&<p role="status">{t("members.location.loading")}</p>}
  {status==="error"&&<p role="alert" className="alert alert-warning">
   {t("members.location.failedLoad")}</p>}
  {data&&draft&&status==="ready"&&<>
   <p className="small text-secondary">{t("members.location.intro")}</p>
   <p className="small text-secondary">{t("prefill.teamContext",{team:teamName})}</p>
   <p className="small text-secondary" role="status">
    {t(data.versions.length>0?"prefill.savedContext":
      data.suggestedCountryIso2?"prefill.suggestedCountry":"prefill.unknownCountry")}
   </p>
   {!data.configured&&<p className="alert alert-warning" role="status">
    {t("members.location.suggestedOnly")}</p>}
   {data.archived&&<p className="alert alert-secondary">{t("members.location.archived")}</p>}
   <form onSubmit={save} className="d-grid gap-3">
    <div className="row g-3">
     <div className="col-md-3"><label htmlFor="location-country" className="form-label">
      {t("members.location.country")}</label>
      <input id="location-country" className="form-control" maxLength={2}
       placeholder={t("prefill.optionalCountry")} autoComplete="off" list="member-country-list" value={draft.countryIso2}
       disabled={busy||data.archived}
       onChange={e=>change("countryIso2",e.target.value.toUpperCase())}/>
      <datalist id="member-country-list">{catalog.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</datalist>
     </div>
     <div className="col-md-4"><label htmlFor="location-region" className="form-label">
      {t("members.location.region")}</label>
      <input id="location-region" className="form-control" maxLength={120}
       autoComplete="off" value={draft.region} disabled={busy||data.archived}
       onChange={e=>change("region",e.target.value)}/></div>
     <div className="col-md-5"><label htmlFor="location-city" className="form-label">
      {t("members.location.city")}</label>
      <input id="location-city" className="form-control" maxLength={120}
       autoComplete="off" value={draft.city} disabled={busy||data.archived}
       onChange={e=>change("city",e.target.value)}/></div>
     <div className="col-md-6"><label htmlFor="location-timezone" className="form-label">
      {t("members.location.timeZone")}</label>
      <input id="location-timezone" className="form-control" maxLength={128}
       list="location-iana-examples" placeholder="Europe/Paris" autoComplete="off"
       value={draft.timeZone} disabled={busy||data.archived}
       onChange={e=>change("timeZone",e.target.value)}/>
      <datalist id="location-iana-examples">
       {["Europe/Paris","Europe/Berlin","Europe/London","America/Toronto",
        "America/New_York","Asia/Tokyo","UTC"].map(z=><option key={z} value={z}/>)}
      </datalist>
      <p className="form-text">{t("members.location.zoneHint")}</p>
     </div>
     <div className="col-md-4"><label htmlFor="location-effective" className="form-label">
      {t("members.location.effectiveFrom")}</label>
      <input id="location-effective" type="date" required className="form-control"
       min={earliest} value={draft.effectiveFrom} disabled={busy||data.archived}
       onChange={e=>change("effectiveFrom",e.target.value)}/></div>
    </div>
    <p className="small text-secondary">{t("members.location.separateLocale")}</p>
    <button type="submit" disabled={busy||data.archived} className="btn btn-primary align-self-start">
     {t(busy?"members.location.saving":"members.location.save")}</button>
   </form>
   <div>
    <h4 className="h6">{t("members.location.history")}</h4>
    {data.versions.length===0?<p>{t("members.location.noHistory")}</p>:
     <div className="table-responsive"><table className="table table-sm">
      <thead><tr><th>{t("members.location.revision")}</th>
       <th>{t("members.location.effectiveFrom")}</th>
       <th>{t("members.location.country")}</th>
       <th>{t("members.location.timeZone")}</th></tr></thead>
      <tbody>{data.versions.map(v=><tr key={v.revision}>
       <td>{v.revision}</td><td>{v.effective_from}</td>
       <td>{v.country_iso2??t("members.location.unknown")}</td>
       <td>{v.time_zone??t("members.location.unknown")}</td>
      </tr>)}</tbody>
     </table></div>}
   </div>
   <section className="border-top pt-3">
    <h4 className="h6">{t("members.location.historicalTitle")}</h4>
    <div className="d-flex gap-2 flex-wrap align-items-end">
     <div><label htmlFor="location-lookback" className="form-label">{t("members.location.onDate")}</label>
      <input id="location-lookback" type="date" className="form-control"
       value={onDate} onChange={e=>setOnDate(e.target.value)}/></div>
     <button type="button" className="btn btn-outline-primary"
      onClick={()=>void historical()}>{t("members.location.showDate")}</button>
    </div>
    {historyViewed&&<p role="status" className="mt-2">
     {history?t("members.location.historicalResult",{
      country:history.countryIso2??t("members.location.unknown"),
      zone:history.timeZone??t("members.location.unknown")
     }):t("members.location.historicalMissing")}</p>}
   </section>
   <section className="border-top pt-3">
    <h4 className="h6">{t("members.location.eventTitle")}</h4>
    <p className="small text-secondary">{t("members.location.eventHelp")}</p>
    <div className="d-flex gap-2 flex-wrap align-items-end">
     <div><label htmlFor="event-utc" className="form-label">{t("members.location.eventUtc")}</label>
      <input id="event-utc" className="form-control" maxLength={32}
       value={eventUtc} onChange={e=>setEventUtc(e.target.value)}/></div>
     <button type="button" className="btn btn-outline-primary"
      onClick={()=>void convertEvent()}>{t("members.location.convert")}</button>
    </div>
    {preview&&<p role="status" className="mt-2">
     {t("members.location.eventResult",{utc:preview.utc,
      local:preview.label,zone:preview.timeZone})}</p>}
   </section>
   <p className="small text-secondary">{t("members.location.nationalOnly")}</p>
  </>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {message&&<p role="status" className="alert alert-success">{message}</p>}
  <button type="button" disabled={busy} className="btn btn-outline-secondary align-self-start"
   onClick={close}>{t("members.profile.cancel")}</button>
 </section>;
}
