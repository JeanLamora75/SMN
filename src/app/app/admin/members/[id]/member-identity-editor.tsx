"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useEffect as useDirtyEffect} from "react";
import {utcOffsetLabel} from "@/lib/iana-utc-offset";
type Member={id:string;displayName:string;email:string|null;professionalFunction?:string|null;revision:number};
type Location={revision:number;countryIso2:string|null;region:string|null;city:string|null;timeZone:string|null};
type LocationState={today:string;current:Location|null;versions:{revision:number;effective_from:string;country_iso2:string|null;region:string|null;city:string|null;time_zone:string|null}[];suggestedCountryIso2:string|null};
export default function MemberIdentityEditor({member,onSaved,onCancel,onDirtyChange}:{member:Member;onSaved:()=>void;onCancel:()=>void;onDirtyChange?:(dirty:boolean)=>void}){
 const t=useTranslation();
 const [name,setName]=useState(member.displayName);
 const [email,setEmail]=useState(member.email??"");
 const [profession,setProfession]=useState(member.professionalFunction??"");
 const [location,setLocation]=useState<LocationState|null>(null);
 const [country,setCountry]=useState("");
 const [countries,setCountries]=useState<{code:string;name:string}[]>([]);
 const [countriesFailed,setCountriesFailed]=useState(false);
 const [timeZones]=useState<string[]>(()=>["UTC",...Intl.supportedValuesOf("timeZone")]);
 const [region,setRegion]=useState("");
 const [city,setCity]=useState("");
 const [zone,setZone]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [locationBaseline,setLocationBaseline]=useState<string|null>(null);
 const dirty=name!==member.displayName||email!==(member.email??"")||profession!==(member.professionalFunction??"")||
  (locationBaseline!==null&&JSON.stringify([country,region,city,zone])!==locationBaseline);
 useDirtyEffect(()=>{onDirtyChange?.(dirty);},[dirty,onDirtyChange]);

 useEffect(()=>{const controller=new AbortController();void fetch("/api/admin/countries",{cache:"no-store",signal:controller.signal})
  .then(async r=>{if(!r.ok)throw Error("countries");return r.json() as Promise<{countries:{code:string;name:string}[]}>;})
  .then(data=>{if(!controller.signal.aborted)setCountries(data.countries);})
  .catch(()=>{if(!controller.signal.aborted)setCountriesFailed(true);});return()=>controller.abort();},[]);
 useEffect(()=>{let active=true;fetch("/api/admin/members/"+encodeURIComponent(member.id)+"/location",{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error("load");return r.json() as Promise<LocationState>;})
  .then(v=>{if(!active)return;setLocation(v);const latest=v.versions.at(-1);
   setCountry(latest?.country_iso2??v.current?.countryIso2??v.suggestedCountryIso2??"");
   setLocationBaseline(JSON.stringify([latest?.country_iso2??v.current?.countryIso2??v.suggestedCountryIso2??"",latest?.region??v.current?.region??"",latest?.city??v.current?.city??"",latest?.time_zone??v.current?.timeZone??""]));
   setRegion(latest?.region??v.current?.region??"");setCity(latest?.city??v.current?.city??"");setZone(latest?.time_zone??v.current?.timeZone??"");
})
  .catch(()=>{if(active)setError(t("memberUX.loadFailed"));});
  return()=>{active=false;};},[member.id,t]);
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||!location)return;setBusy(true);setError("");
  try{
   const latest=location.versions.at(-1);
   const r=await fetch("/api/admin/members/"+encodeURIComponent(member.id)+"/identity",{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({displayName:name.trim(),email:email.trim()||null,professionalFunction:profession.trim()||null,
     revision:member.revision,location:{countryIso2:country.trim().toUpperCase()||null,
      region:region.trim()||null,city:city.trim()||null,timeZone:zone.trim()||null,
      effectiveFrom:latest&&latest.effective_from>location.today?latest.effective_from:location.today,
      revision:latest?.revision??0}})});
   if(!r.ok)throw Error("identity-"+r.status);
   onSaved();
  }catch{setError(t("memberUX.identitySaveFailed"));}
  finally{setBusy(false);}
 }
 return <form className="d-grid gap-3" onSubmit={e=>void save(e)}>
  <div className="row g-3">
   <div className="col-md-6"><label className="form-label">{t("members.name")}<input className="form-control" value={name} onChange={e=>setName(e.target.value)} maxLength={120} required disabled={busy}/></label></div>
   <div className="col-md-6"><label className="form-label">{t("members.profile.emailLabel")}<input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} disabled={busy}/></label></div>
   <div className="col-12"><label className="form-label">{t("memberUX.functionLabel")}<input className="form-control" value={profession} onChange={e=>setProfession(e.target.value)} maxLength={120} disabled={busy}/></label></div>
   <div className="col-md-3"><label className="form-label">{t("memberUX.countryLabel")}<select className="form-select" value={country} onChange={e=>setCountry(e.target.value)} disabled={busy||!location||countriesFailed}>
    <option value="">{t("memberUX.countryNone")}</option>
    {country&&!countries.some(c=>c.code===country)&&<option value={country}>{country} — {t("memberUX.countryLegacy")}</option>}
    {countries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}
   </select>{countriesFailed&&<small className="text-danger d-block">{t("memberUX.countriesUnavailable")}</small>}</label></div>
   <div className="col-md-3"><label className="form-label">{t("memberUX.regionLabel")}<input className="form-control" value={region} onChange={e=>setRegion(e.target.value)} maxLength={120} disabled={busy||!location}/></label></div>
   <div className="col-md-3"><label className="form-label">{t("memberUX.cityLabel")}<input className="form-control" value={city} onChange={e=>setCity(e.target.value)} maxLength={120} disabled={busy||!location}/></label></div>
   <div className="col-md-3"><label className="form-label">{t("memberUX.zoneLabel")}<select className="form-select" value={zone} onChange={e=>setZone(e.target.value)} disabled={busy||!location}>
    <option value="">{t("memberUX.zoneNone")}</option>
    {zone&&!timeZones.includes(zone)&&<option value={zone}>{zone} ({utcOffsetLabel(zone)}) — {t("memberUX.zoneLegacy")}</option>}
    {timeZones.map(z=><option key={z} value={z}>{z} ({utcOffsetLabel(z)})</option>)}
   </select></label></div>
  </div>
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  <div className="smn-cockpit-form-actions"><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={onCancel}>{t("teamUX.cancel")}</button>
   <button type="submit" className="btn btn-primary" disabled={busy||!location}>{t("members.profile.save")}</button></div>
 </form>;
}
