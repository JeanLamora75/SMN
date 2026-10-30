"use client";
import {useEffect,useState,type FormEvent} from "react";

type WorkDay={weekday:number;morning:boolean;afternoon:boolean};
type Location={revision:number;country_iso2:string|null;region:string|null;city:string|null;time_zone:string|null;effective_from:string};
type Calendar={revision:number;effective_from:string;days:WorkDay[]};
const weekdays=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
export default function MemberTeamPlanningEditor({memberId,teamId,kind,onSaved,onCancel}:{
 memberId:string;teamId:string;kind:"location"|"calendar";onSaved:()=>void;onCancel:()=>void;
}){
 const [date,setDate]=useState("");
 const [revision,setRevision]=useState(0);
 const [location,setLocation]=useState({countryIso2:"",region:"",city:"",timeZone:""});
 const [week,setWeek]=useState<WorkDay[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[ready,setReady]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/team-"+kind+"?"+new URLSearchParams({teamId}),
   {cache:"no-store",signal:controller.signal})
   .then(async res=>{if(!res.ok)throw Error("load");return res.json() as Promise<
    {current:Location|null;today:string}|{current:Calendar|null;suggestedWeek:WorkDay[];today:string}>;})
   .then(result=>{
    if(controller.signal.aborted)return;
    setDate(result.today);
    if(kind==="location"){
     const current=result.current as Location|null;
     setRevision(current?.revision??0);
     setLocation({countryIso2:current?.country_iso2??"",region:current?.region??"",
      city:current?.city??"",timeZone:current?.time_zone??""});
     if(current?.effective_from&&current.effective_from>result.today)setDate(current.effective_from);
    }else{
     const payload=result as {current:Calendar|null;suggestedWeek:WorkDay[];today:string};
     setRevision(payload.current?.revision??0);
     setWeek((payload.current?.days??payload.suggestedWeek).map(day=>({...day})));
     if(payload.current?.effective_from&&payload.current.effective_from>result.today)setDate(payload.current.effective_from);
    }
    setReady(true);
   }).catch(()=>{if(!controller.signal.aborted)setError("Impossible de charger les paramètres.");});
  return()=>controller.abort();
 },[memberId,teamId,kind]);
 async function submit(event:FormEvent){
  event.preventDefault();if(busy||!ready)return;
  setBusy(true);setError("");
  const change=kind==="location"?{
   countryIso2:location.countryIso2.trim().toUpperCase()||null,region:location.region.trim()||null,
   city:location.city.trim()||null,timeZone:location.timeZone.trim()||null,
   effectiveFrom:date,revision
  }:{action:"weekly",effectiveFrom:date,revision,days:week};
  try{
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/team-"+kind,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({teamId,change})
   });
   const result=await response.json() as {error?:string};
   if(!response.ok){setError(result.error==="conflict"?"Les données ont changé. Rouvrez l'éditeur.":
    result.error==="invalid-date"?"La date d'effet ne peut précéder la dernière version ou aujourd'hui.":
    "Impossible d'enregistrer les paramètres.");return;}
   onSaved();
  }catch{setError("Service temporairement indisponible.");}
  finally{setBusy(false);}
 }
 const field=(key:keyof typeof location,label:string,maxLength:number)=><label className="col-md-6">{label}
  <input className="form-control mt-1" value={location[key]} maxLength={maxLength} disabled={busy}
   onChange={e=>setLocation(v=>({...v,[key]:e.target.value}))}/></label>;
 return <section className="smn-member-panel p-3" aria-label={kind==="location"?"Modifier la localisation":"Modifier le calendrier"}>
  <h2 className="h5">{kind==="location"?"Modifier la localisation":"Modifier la semaine de travail"}</h2>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {!ready?<p role="status">Chargement…</p>:<form onSubmit={submit} className="row g-3">
   <label className="col-12">Date d&apos;effet<input type="date" required value={date} className="form-control mt-1" onChange={e=>setDate(e.target.value)} disabled={busy}/></label>
   {kind==="location"?<>
    {field("countryIso2","Code pays (ISO 2 lettres)",2)}
    {field("region","Région",120)}
    {field("city","Ville",120)}
    {field("timeZone","Fuseau horaire (IANA, ex. Europe/Paris)",128)}
   </>:<div className="col-12 table-responsive"><table className="table table-sm">
    <thead><tr><th>Jour</th><th>Matin travaillé</th><th>Après-midi travaillé</th></tr></thead>
    <tbody>{week.map((day,index)=><tr key={day.weekday}>
     <th>{weekdays[index]}</th>
     {(["morning","afternoon"] as const).map(slot=><td key={slot}>
      <input type="checkbox" aria-label={weekdays[index]+" "+slot} checked={day[slot]} disabled={busy}
       onChange={e=>setWeek(days=>days.map((item,i)=>i===index?{...item,[slot]:e.target.checked}:item))}/>
     </td>)}
    </tr>)}</tbody>
   </table></div>}
   <div className="col-12 d-flex justify-content-end gap-2">
    <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={onCancel}>Annuler</button>
    <button type="submit" className="btn btn-primary" disabled={busy}>Enregistrer</button>
   </div>
  </form>}
 </section>;
}
