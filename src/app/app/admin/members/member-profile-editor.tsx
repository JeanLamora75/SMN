"use client";

import {useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

export type EditableMember=Readonly<{
 id:string;displayName:string;email:string|null;isProvisional:boolean;revision:number;
}>;
export default function MemberProfileEditor({member,onSaved,onCancel}:{
 member:EditableMember;
 onSaved:(updated:EditableMember)=>void;
 onCancel:()=>void;
}){
 const t=useTranslation();
 const [displayName,setDisplayName]=useState(member.displayName);
 const [email,setEmail]=useState(member.email??"");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const dirty=displayName!==member.displayName||email!==(member.email??"");
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 const cancel=()=>{
  if(busy)return;
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  onCancel();
 };
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(busy)return;
  setError("");
  const name=displayName.trim();
  if(!name||name.length>120||/[\u0000-\u001f\u007f]/u.test(displayName)){
   setError(t("members.profile.invalidName"));return;
  }
  if(email.length>254){
   setError(t("members.profile.invalidEmail"));return;
  }
  setBusy(true);
  try{
   const response=await fetch("/api/admin/members/"+encodeURIComponent(member.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({displayName:name,email:email.trim()||null,revision:member.revision})
   });
   const result=await response.json() as {error?:string;member?:EditableMember};
   if(!response.ok||!result.member){
    setError(t(response.status===409?"members.profile.conflict":
     response.status===400?"members.profile.invalidInput":
     response.status===404?"members.profile.notFound":"members.profile.failed"));
    return;
   }
   onSaved(result.member);
  }catch{setError(t("members.profile.failed"));}
  finally{setBusy(false);}
 };
 return <form onSubmit={submit} className="smn-panel p-4 d-grid gap-3"
  aria-labelledby="member-profile-title">
  <div>
   <h3 className="h5" id="member-profile-title">{t("members.profile.editTitle")}</h3>
   <p className="small text-secondary mb-0">{t("prefill.optionalProfile")}</p>
   <p className="small text-secondary mb-0">{t(member.isProvisional?
    "members.profile.provisionalHelp":"members.profile.confirmedHelp")}</p>
  </div>
  <div className="row g-3">
   <div className="col-md-6">
    <label htmlFor="profile-name" className="form-label">{t("members.profile.nameLabel")}</label>
    <input id="profile-name" className="form-control" type="text"
     minLength={1} maxLength={120} required autoComplete="off" disabled={busy}
     value={displayName} onChange={e=>setDisplayName(e.target.value)}/>
   </div>
   <div className="col-md-6">
    <label htmlFor="profile-email" className="form-label">{t("members.profile.emailLabel")}</label>
    <input id="profile-email" className="form-control" type="email"
     maxLength={254} autoComplete="off" disabled={busy}
     value={email} onChange={e=>setEmail(e.target.value)}/>
    <p className="form-text">{t("members.profile.emailHelp")}</p>
   </div>
  </div>
  <p className="small text-secondary mb-0">{t("members.profile.identityNotice")}</p>
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  <div className="d-flex flex-wrap gap-2">
   <button type="submit" className="btn btn-primary" disabled={busy||!dirty}>
    {busy?t("members.profile.saving"):t("members.profile.save")}</button>
   <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={cancel}>
    {t("members.profile.cancel")}</button>
  </div>
 </form>;
}
