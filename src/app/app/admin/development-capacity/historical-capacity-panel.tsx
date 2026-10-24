"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type Quality="known"|"estimated"|"not-supplied";
type Kind="document"|"import"|"reconstruction"|"other";
type HistoricalValue={
 quality:Quality;qualifiedJh:number|null;sourceKind:Kind|null;
 sourceRef:string|null;rationale:string|null;revision:number;updatedAt:string|null;
};
type Revision={revision:number;before:HistoricalValue|null;after:HistoricalValue;
 changedAt:string;changedBy:string|null};
type Historical=HistoricalValue&{
 start:string;end:string;asOfDate:string;isHistorical:boolean;history:Revision[];
};
type Actual={status:"upcoming"|"in-progress"|"finished"|"closed";
 retainedJh:number|null;source:"Saisie"|"Calcul"|"Non renseigné"};
type Draft={quality:Quality;value:string;kind:Kind;reference:string;rationale:string};
const fresh=(v:Historical):Draft=>({
 quality:v.quality,value:v.qualifiedJh===null?"":String(v.qualifiedJh),
 kind:v.sourceKind??"document",reference:v.sourceRef??"",
 rationale:v.rationale??""
});
const fmt=(v:number)=>v.toLocaleString("fr-FR",{maximumFractionDigits:4});
const qualityKey:Record<Quality,"known"|"estimated"|"notSupplied">={
 known:"known",estimated:"estimated","not-supplied":"notSupplied"
};
const sourceKey:Record<Kind,"document"|"import"|"reconstruction"|"other">={
 document:"document",import:"import",reconstruction:"reconstruction",other:"other"
};
export default function HistoricalCapacityPanel({start,end}:{start:string;end:string}){
 const t=useTranslation();
 const [data,setData]=useState<Historical|null>(null);
 const [actual,setActual]=useState<Actual|null>(null);
 const [draft,setDraft]=useState<Draft|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const dirty=Boolean(data&&draft&&JSON.stringify(draft)!==JSON.stringify(fresh(data)));
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 const fetchHistory=async()=>{
  const params=new URLSearchParams({start,end});
  const result=await fetch("/api/admin/capacity-history?"+params.toString(),{
   cache:"no-store"
  });
  if(!result.ok)throw Error("historical-quality-load");
  const value=await result.json() as Historical;
  if(!value||!Array.isArray(value.history)||typeof value.revision!=="number")
   throw Error("historical-quality-invalid-response");
  setData(value);setDraft(fresh(value));
 };
 useEffect(()=>{
  let active=true;
  const params=new URLSearchParams({start,end});
  void Promise.resolve().then(async()=>{
   if(!active)return;
   setLoading(true);setData(null);setActual(null);
   setError("");setSuccess("");
   try{
    const response=await fetch("/api/admin/capacity-history?"+params.toString(),{
     cache:"no-store"
    });
    if(!response.ok)throw Error("historical-quality-load");
    const item=await response.json() as Historical;
    if(!item||!Array.isArray(item.history)||typeof item.revision!=="number")
     throw Error("historical-quality-shape");
    if(!active)return;
    setData(item);setDraft(fresh(item));
    if(item.isHistorical){
     try{
      const actualResponse=await fetch("/api/admin/capacity-actual?"+
       params.toString(),{cache:"no-store"});
      if(actualResponse.ok){
       const actualValue=await actualResponse.json() as Actual;
       if(active)setActual(actualValue);
      }
     }catch{/* The historical provenance remains readable when actuals are unavailable. */}
    }
   }catch{if(active)setError(t("historicalQuality.loadError"));}
   finally{if(active)setLoading(false);}
  });
  return ()=>{active=false;};
 },[start,end,t]);
 const save=async()=>{
  if(!data||!data.isHistorical||!draft||busy)return;
  const known=draft.quality!=="not-supplied";
  const numeric=Number(draft.value);
  if(draft.rationale.trim().length<5||draft.rationale.trim().length>1000||
   (known&&(draft.value.trim()===""||!Number.isFinite(numeric)||
    numeric<0||numeric>99999999.9999||
    Math.abs(Math.round(numeric*10000)-numeric*10000)>1e-6||
    draft.reference.trim().length<3||draft.reference.trim().length>500||
    (draft.quality==="known"&&draft.kind==="reconstruction")))){
   setError(t("historicalQuality.invalid"));return;
  }
  setBusy(true);setError("");setSuccess("");
  try{
   const payload={start,end,revision:data.revision,quality:draft.quality,
    qualifiedJh:known?numeric:null,sourceKind:known?draft.kind:null,
    sourceRef:known?draft.reference.trim():null,rationale:draft.rationale.trim()};
   const res=await fetch("/api/admin/capacity-history",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
   });
   if(!res.ok){
    setError(t(res.status===409?"historicalQuality.conflict":
     "historicalQuality.saveError"));return;
   }
   await fetchHistory();
   setSuccess(t("historicalQuality.saved"));
  }catch{setError(t("historicalQuality.saveError"));}
  finally{setBusy(false);}
 };
 const historicalGap=data&&actual&&data.quality==="known"&&
  data.qualifiedJh!==null&&actual.retainedJh!==null&&
  (actual.status==="finished"||actual.status==="closed")?
  Math.round((actual.retainedJh-data.qualifiedJh+Number.EPSILON)*10000)/10000:null;
 const label=(quality:Quality)=>t(("historicalQuality."+qualityKey[quality]) as
  "historicalQuality.known");
 return <section className="smn-panel p-3 d-grid gap-3" aria-labelledby="historical-quality-title">
  <h2 id="historical-quality-title" className="h5">{t("historicalQuality.title")}</h2>
  <p className="small text-secondary">{t("historicalQuality.intro")}</p>
  {loading&&<p role="status">{t("historicalQuality.loading")}</p>}
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  {success&&<p className="alert alert-success" role="status">{success}</p>}
  {data&&!loading&&<>
   {!data.isHistorical?<p className="alert alert-secondary">
     {t("historicalQuality.notHistorical")}</p>:<>
    <p>{t("historicalQuality.quality")}: <strong>{label(data.quality)}</strong></p>
    <p>{t("historicalQuality.qualifiedValue")}: {data.qualifiedJh===null?
     t("historicalQuality.notSupplied"):fmt(data.qualifiedJh)+" JH"}</p>
    {data.quality==="estimated"&&<p className="alert alert-warning">
     {t("historicalQuality.estimatedWarning")}</p>}
    {data.sourceRef&&<p>{t("historicalQuality.sourceReference")}: {data.sourceRef}</p>}
    <p>{t("historicalQuality.actual")}: {actual&&actual.retainedJh!==null?fmt(actual.retainedJh)+" JH":
      t("historicalQuality.actualUnknown")}</p>
    {actual&&actual.retainedJh!==null&&
     <p className="small text-secondary">{t("historicalQuality.actualSource")}:
      {" "}{t(actual.source==="Saisie"?"historicalQuality.manualMode":
       actual.source==="Calcul"?"historicalQuality.calculatedMode":
       "historicalQuality.notSupplied")}</p>}
    <p>{t("historicalQuality.comparison")}: {historicalGap===null?
     t("historicalQuality.comparisonUnknown"):fmt(historicalGap)+" JH"}</p>
    <p className="small text-secondary">{t("historicalQuality.comparisonCaution")}</p>
    {draft&&<div className="border-top pt-3 d-grid gap-2">
     <label htmlFor="history-quality" className="form-label">
      {t("historicalQuality.selectQuality")}</label>
     <select id="history-quality" className="form-select" value={draft.quality}
      disabled={busy} onChange={e=>{const next=e.target.value as Quality;setDraft({...draft,quality:next,
       kind:next==="known"&&draft.kind==="reconstruction"?"document":draft.kind});}}>
      <option value="not-supplied">{t("historicalQuality.notSupplied")}</option>
      <option value="known">{t("historicalQuality.known")}</option>
      <option value="estimated">{t("historicalQuality.estimated")}</option>
     </select>
     {draft.quality!=="not-supplied"&&<>
      <label htmlFor="history-value" className="form-label">
       {t("historicalQuality.qualifiedValue")}</label>
      <input id="history-value" type="number" className="form-control"
       min="0" max="99999999.9999" step="0.0001" value={draft.value}
       disabled={busy} onChange={e=>setDraft({...draft,value:e.target.value})}/>
      <label htmlFor="history-kind" className="form-label">
       {t("historicalQuality.sourceKind")}</label>
      <select id="history-kind" className="form-select" value={draft.kind}
       disabled={busy} onChange={e=>setDraft({...draft,kind:e.target.value as Kind})}>
       <option value="document">{t("historicalQuality.document")}</option>
       <option value="import">{t("historicalQuality.import")}</option>
       <option value="other">{t("historicalQuality.other")}</option>
       {draft.quality==="estimated"&&<option value="reconstruction">
        {t("historicalQuality.reconstruction")}</option>}
      </select>
      <label htmlFor="history-reference" className="form-label">
       {t("historicalQuality.sourceReference")}</label>
      <input id="history-reference" className="form-control" maxLength={500}
       value={draft.reference} disabled={busy}
       onChange={e=>setDraft({...draft,reference:e.target.value})}/>
     </>}
     <label htmlFor="history-rationale" className="form-label">
      {t("historicalQuality.rationale")}</label>
     <textarea id="history-rationale" className="form-control" rows={3} maxLength={1000}
      value={draft.rationale} disabled={busy}
      onChange={e=>setDraft({...draft,rationale:e.target.value})}/>
     <p className="small text-secondary">{t("historicalQuality.evidenceHint")}</p>
     <button type="button" className="btn btn-primary align-self-start"
      disabled={busy||!dirty} onClick={()=>void save()}>
      {t("historicalQuality.save")}</button>
    </div>}
    <div className="border-top pt-3">
     <h3 className="h6">{t("historicalQuality.history")}</h3>
     {data.history.length===0?<p>{t("historicalQuality.noHistory")}</p>:<>
      <ul>{data.history.map(r=><li key={r.revision}>
       {t("historicalQuality.revision")} {r.revision} — {r.changedAt}:
       {" "}{r.before?label(r.before.quality):t("historicalQuality.notSupplied")}
       {" → "}{label(r.after.quality)} —
       {r.after.qualifiedJh===null?t("historicalQuality.notSupplied"):
        fmt(r.after.qualifiedJh)+" JH"}
       {r.after.sourceRef?" — "+r.after.sourceRef:""} — {r.after.rationale??""}
      </li>)}</ul>
      {data.history.length===100&&<p className="small text-secondary">
       {t("historicalQuality.historyLimit")}</p>}
     </>}
    </div>
   </>}
  </>}
 </section>;
}
