"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
type Member={id:string;displayName:string;email:string|null;professionalFunction?:string|null;revision:number};
type Location={revision:number;countryIso2:string|null;region:string|null;city:string|null;timeZone:string|null};
type LocationState={today:string;current:Location|null;versions:{revision:number}[];suggestedCountryIso2:string|null};
export default function MemberIdentityEditor({member,onSaved,onCancel}:{member:Member;onSaved:()=>void;onCancel:()=>void}){
 const t=useTranslation();
 const [name,setName]=useState(member.displayName);
 const [email,setEmail]=useState(member.email??"");
 const [profession,setProfession]=useState(member.professionalFunction??"");
 const [location,setLocation]=useState<LocationState|null>(null);
 const [country,setCountry]=useState("");
 const [region,setRegion]=useState("");
 const [city,setCity]=useState("");
 const [zone,setZone]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{let active=true;fetch("/api/admin/members/"+encodeURIComponent(member.id)+"/location",{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error("load");return r.json() as Promise<LocationState>;})
  .then(v=>{if(!active)return;setLocation(v);setCountry(v.current?.countryIso2??v.suggestedCountryIso2??"");
   setRegion(v.current?.region??"");setCity(v.current?.city??"");setZone(v.current?.timeZone??"");
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
      effectiveFrom:location.today,revision:latest?.revision??0}})});
   if(!r.ok)throw Error("identity-"+r.status);
   onSaved();
  }catch(err){setError(t("memberUX.identitySaveFailed")+(err instanceof Error?" ("+err.message+")":""));}
  finally{setBusy(false);}
 }
 return <form className="d-grid gap-3" onSubmit={e=>void save(e)}>
  <div className="row g-3">
   <div className="col-md-6"><label className="form-label">{t("members.name")}<input className="form-control" value={name} onChange={e=>setName(e.target.value)} maxLength={120} required disabled={busy}/></label></div>
   <div className="col-md-6"><label className="form-label">{t("members.profile.emailLabel")}<input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} disabled={busy}/></label></div>
   <div className="col-12"><label className="form-label">{t("memberUX.functionLabel")}<input className="form-control" value={profession} onChange={e=>setProfession(e.target.value)} maxLength={120} disabled={busy}/></label></div>
   <div className="col-md-3"><label className="form-label">{t("memberUX.countryLabel")}<input className="form-control" value={country} onChange={e=>setCountry(e.target.value)} maxLength={2} disabled={busy||!location}/></label></div>
   <div className="col-md-3"><label className="form-label">{t("memberUX.regionLabel")}<input className="form-control" value={region} onChange={e=>setRegion(e.target.value)} maxLength={120} disabled={busy||!location}/></label></div>
   <div className="col-md-3"><label className="form-label">{t("memberUX.cityLabel")}<input className="form-control" value={city} onChange={e=>setCity(e.target.value)} maxLength={120} disabled={busy||!location}/></label></div>
   <div className="col-md-3"><label className="form-label">{t("memberUX.zoneLabel")}<input className="form-control" value={zone} onChange={e=>setZone(e.target.value)} maxLength={128} disabled={busy||!location}/></label></div>
  </div>
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  <div className="d-flex gap-2 justify-content-end"><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={onCancel}>{t("teamUX.cancel")}</button>
   <button type="submit" className="btn btn-primary" disabled={busy||!location}>{t("members.profile.save")}</button></div>
 </form>;
}
