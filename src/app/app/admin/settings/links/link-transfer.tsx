"use client";
import {useState} from "react";
import LinkDialog from "../../links/link-dialog";
import {useTranslation} from "@/i18n/client";
type Item={id:string;title:string;scope:"TRANSVERSE"|"EQUIPE";teamId:string|null;revision:number};
type Team={id:string;name:string};
export default function LinkTransfer({item,teams,onClose,onDone}:{
 item:Item;teams:Team[];onClose:()=>void;onDone:()=>void;
}){
 const t=useTranslation();
 const [scope,setScope]=useState(item.scope);
 const [teamId,setTeamId]=useState(item.teamId??"");
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const changed=scope!==item.scope||(scope==="EQUIPE"&&teamId!==item.teamId);
 const valid=changed&&confirmed&&(scope==="TRANSVERSE"||teams.some(team=>team.id===teamId));
 const submit=async()=>{
  if(!valid||busy)return;setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/links/"+encodeURIComponent(item.id)+"/transfer",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({scope,teamId:scope==="TRANSVERSE"?null:teamId,revision:item.revision})
   });
   if(!response.ok)throw Error(String(response.status));
   onDone();
  }catch(e){
   const status=e instanceof Error?e.message:"";
   setError(status==="409"?t("links.conflict"):status==="403"?t("links.forbidden"):status==="404"?t("links.notFound"):status==="400"?t("links.invalidFields"):t("links.saveError"));
  }finally{setBusy(false);}
 };
 return <LinkDialog titleId="smn-links-transfer-title" onClose={onClose} locked={busy} large>
  <div className="modal-header"><h2 id="smn-links-transfer-title" className="modal-title fs-5">{t("linksAdmin.transfer")}: {item.title}</h2><button className="btn-close" aria-label={t("links.cancel")} disabled={busy} onClick={onClose}/></div>
  <div className="modal-body d-grid gap-3">
   {error&&<div className="alert alert-danger" role="alert">{error}</div>}
   <div><label htmlFor="smn-transfer-scope" className="form-label">{t("links.scope")}</label><select id="smn-transfer-scope" className="form-select" disabled={busy} value={scope} onChange={e=>{setScope(e.target.value as Item["scope"]);setConfirmed(false);}}><option value="EQUIPE">{t("links.specific")}</option><option value="TRANSVERSE">{t("links.transverse")}</option></select></div>
   {scope==="EQUIPE"&&<div><label htmlFor="smn-transfer-team" className="form-label">{t("links.team")} *</label><select id="smn-transfer-team" className="form-select" value={teamId} disabled={busy} onChange={e=>{setTeamId(e.target.value);setConfirmed(false);}}><option value="">{t("linksAdmin.chooseTeam")}</option>{teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></div>}
   {changed&&<div className="form-check"><input id="smn-transfer-confirm" type="checkbox" className="form-check-input" disabled={busy} checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><label htmlFor="smn-transfer-confirm" className="form-check-label">{t("linksAdmin.transferConfirm")}</label></div>}
  </div><div className="modal-footer"><button className="btn btn-outline-secondary" disabled={busy} onClick={onClose}>{t("links.cancel")}</button><button className="btn btn-primary" disabled={!valid||busy} onClick={()=>void submit()}>{t("links.save")}</button></div>
 </LinkDialog>;
}
