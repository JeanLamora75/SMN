"use client";
import Link from "next/link";
import NeutralAvatar from "./neutral-avatar";
import CountryFlag from "./country-flag";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import TeamContextEditor from "./team-context-editor";
import BootstrapIcon from "../../bootstrap-icon";

type Member={id:string;displayName:string;countryIso2:string|null;professionalFunction?:string|null;isProvisional:boolean;memberNumber:number;archived:boolean;isAssigned:boolean;roleShares:{scrumMaster:number;productOwner:number;developer:number}};
type Roster={team:{id:string;name:string;mode:string};members:Member[]};
type TeamContextOverview={teamId:string;name:string;productName:string;
 vision:string|null;productGoal:string|null;revision:number};
type TeamContextState=
 |{status:"loading"}|{status:"error"}|{status:"ready";value:TeamContextOverview};
type View="cards"|"list";
const CHOICE="smn-team-roster-view";
export default function TeamOverview({canManage,initialTeamId=null}:{canManage:boolean;initialTeamId?:string|null}){
 const t=useTranslation();
 const router=useRouter();
 const [roster,setRoster]=useState<Roster|null>(null);
 const [teamContext,setTeamContext]=useState<TeamContextState>({status:"loading"});
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [view,setView]=useState<View>("cards");
 const [creationOpen,setCreationOpen]=useState(false);
 const [newName,setNewName]=useState("");
 const [creating,setCreating]=useState(false);
 const [createError,setCreateError]=useState("");
 const requestId=useRef<string|null>(null);
 useEffect(()=>{void Promise.resolve().then(()=>{try{if(localStorage.getItem(CHOICE)==="list")setView("list");}catch{}});},[]);
 useEffect(()=>{let alive=true;fetch("/api/admin/members"+(initialTeamId?"?"+new URLSearchParams({teamId:initialTeamId}):""),{cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error("members");return r.json() as Promise<Roster>;})
  .then(v=>{if(alive){setRoster(v);setStatus("ready");}})
  .catch(()=>{if(alive)setStatus("error");});return()=>{alive=false;};},[initialTeamId]);
 useEffect(()=>{
  const teamId=roster?.team.id;
  if(!teamId)return;
  const controller=new AbortController();
  void fetch("/api/admin/team-context?"+new URLSearchParams({teamId}),{
   cache:"no-store",signal:controller.signal
  }).then(async response=>{
   if(!response.ok)throw Error("team-context");
   return response.json() as Promise<{context:TeamContextOverview}>;
  }).then(result=>{
   if(!controller.signal.aborted){
    if(result.context?.teamId!==teamId)throw Error("team-context-scope");
    setTeamContext(previous=>previous.status==="ready"&&
     previous.value.teamId===teamId&&previous.value.revision>result.context.revision?
      previous:{status:"ready",value:result.context});
   }
  }).catch(()=>{
   if(!controller.signal.aborted)setTeamContext({status:"error"});
  });
  return()=>controller.abort();
 },[roster?.team.id]);
 function choose(next:View){setView(next);try{localStorage.setItem(CHOICE,next);}catch{}}
 async function createOne(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!roster||creating||!newName.trim())return;
  setCreating(true);setCreateError("");
  requestId.current??=crypto.randomUUID();
  try{
   const r=await fetch("/api/admin/members",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId:roster.team.id,displayName:newName.trim(),requestId:requestId.current})});
   const body=await r.json() as {error?:string};
   if(!r.ok)throw Error(body.error??"service");
   const refreshed=await fetch("/api/admin/members"+(initialTeamId?"?"+new URLSearchParams({teamId:initialTeamId}):""),{cache:"no-store"});
   if(!refreshed.ok)throw Error("refresh-failed");
   setRoster(await refreshed.json() as Roster);
   setCreationOpen(false);setNewName("");requestId.current=null;
  }catch(err){setCreateError(err instanceof Error?err.message:"service");}
  finally{setCreating(false);}
 }
 const detailUrl=(id:string)=>"/app/admin/members/"+encodeURIComponent(id)+
  (roster?.team.id?"?"+new URLSearchParams({teamId:roster.team.id}):"");
 const members=(roster?.members??[]).filter(m=>!m.archived);
 const capacity=Math.max(12,Math.ceil((members.length+1)/6)*6);
 const roles=(m:Member)=>([["SM",m.roleShares?.scrumMaster],["PO",m.roleShares?.productOwner],["Dev",m.roleShares?.developer]] as const);
 const currentContext=teamContext.status==="ready"&&
  teamContext.value.teamId===roster?.team.id?teamContext.value:null;
 const contextText=(value:string|null|undefined)=>teamContext.status==="loading"?
  t("teamUX.contextPreviewLoading"):teamContext.status==="error"?
  t("teamUX.contextPreviewUnavailable"):value?.trim()||
  t("teamUX.contextPreviewEmpty");
 return <section className="smn-panel smn-team-roster p-3 p-lg-4">
  <header className="smn-team-page-header mb-4">
   <div className="smn-team-summary">
    <div className="d-flex align-items-center gap-2 flex-wrap">
     <h1 className="h3 mb-0">{roster?.team.name??t("members.teamTitle")}</h1>
     {canManage&&roster&&<TeamContextEditor teamId={roster.team.id}
      teamName={roster.team.name} onSaved={updated=>{
       setRoster(current=>current?{...current,team:{...current.team,name:updated.name}}:current);
       setTeamContext({status:"ready",value:updated});
      }}/>}
    </div>
    <p className="smn-team-summary-meta text-secondary mb-0 mt-2">
     <span><strong>{t("teamUX.productLabel")} :</strong>{" "}
      {contextText(currentContext?.productName)}</span>
     <span className="smn-team-summary-divider" aria-hidden="true">·</span>
     <span>{t("teamUX.activeCount",{count:members.length})}</span>
    </p>
   </div>
   <div className="smn-team-context-preview" aria-label={t("teamUX.contextOverview")}>
    <section className="smn-team-context-section">
     <span className="smn-kpi-icon smn-team-context-icon" aria-hidden="true">
      <BootstrapIcon name="bullseye"/>
     </span>
     <div className="smn-team-context-copy">
      <h2 className="smn-team-context-heading">{t("teamUX.contextVision")}</h2>
      <p className="smn-team-context-description" title={currentContext?.vision??undefined}>
       {contextText(currentContext?.vision)}
      </p>
     </div>
    </section>
    <section className="smn-team-context-section">
     <span className="smn-kpi-icon smn-team-context-icon" aria-hidden="true">
      <BootstrapIcon name="stack"/>
     </span>
     <div className="smn-team-context-copy">
      <h2 className="smn-team-context-heading">{t("teamUX.contextGoalHeading")}</h2>
      <p className="smn-team-context-description" title={currentContext?.productGoal??undefined}>
       {contextText(currentContext?.productGoal)}
      </p>
     </div>
    </section>
   </div>
   <div className="btn-group smn-team-view-switch" role="group" aria-label={t("teamUX.displayMode")}>
    <button type="button" className={"btn "+(view==="cards"?"btn-primary":"btn-outline-secondary")} aria-label={t("teamUX.cardsView")} aria-pressed={view==="cards"} onClick={()=>choose("cards")}>▦</button>
    <button type="button" className={"btn "+(view==="list"?"btn-primary":"btn-outline-secondary")} aria-label={t("teamUX.listView")} aria-pressed={view==="list"} onClick={()=>choose("list")}>☷</button>
   </div>
  </header>
  {status==="loading"&&<p role="status">{t("members.loading")}</p>}
  {status==="error"&&<p role="alert">{t("members.loadFailed")}</p>}
  {status==="ready"&&roster?.members.length===0&&<div className="alert alert-info mb-3">{t("teamUX.notInitialized")} <Link href="/app/admin/members/manage" className="alert-link">{t("teamUX.initialize")}</Link></div>}
  {status==="ready"&&view==="cards"&&<div className="row row-cols-2 row-cols-md-3 row-cols-xl-6 g-3">
   {Array.from({length:capacity},(_,i)=>{const m=members[i];
    return <div className="col" key={m?.id??"slot-"+i}>
     {m?<Link href={detailUrl(m.id)} className="card smn-team-card text-decoration-none text-body h-100 rounded-4 shadow-sm" style={{minHeight:222}}>
       <div className="card-body d-flex flex-column align-items-center text-center gap-2">
        <div className="d-flex w-100 align-items-center justify-content-center gap-2" style={{minWidth:0}}><CountryFlag key={m.countryIso2??"none"} countryIso2={m.countryIso2}/><strong className="text-truncate" title={m.displayName}>{m.displayName}</strong></div>
        <NeutralAvatar/>
        <div className="smn-team-roles d-flex gap-1 justify-content-center">{roles(m).map(([name,share])=><span key={name} className={"badge "+((share??0)>0?("text-bg-primary"):"text-bg-secondary opacity-50")}>{name}</span>)}</div>
        <small className="text-secondary">{m.professionalFunction??t("teamUX.functionMissing")}</small>
       </div>
      </Link>:i===members.length?<button type="button" onClick={()=>setCreationOpen(true)} disabled={roster?.members.length===0} className="smn-team-add h-100 w-100 d-flex flex-column align-items-center justify-content-center gap-2 text-primary" style={{minHeight:180}} aria-label={t("teamUX.addMember")}>
        <span className="display-5" aria-hidden="true">+</span><strong>{t("teamUX.addMember")}</strong>
       </button>:<div className="smn-team-placeholder h-100" aria-hidden="true"/>}
    </div>})}
  </div>}
  {status==="ready"&&view==="list"&&<div className="table-responsive"><table className="table table-hover align-middle">
   <thead><tr><th>{t("teamUX.member")}</th><th>SM</th><th>PO</th><th>Dev</th><th>{t("teamUX.details")}</th></tr></thead>
   <tbody>{members.map(m=><tr key={m.id} role="link" tabIndex={0} style={{cursor:"pointer"}} aria-label={t("teamUX.openMember",{name:m.displayName})} onClick={()=>router.push(detailUrl(m.id))} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();router.push(detailUrl(m.id));}}}><th><span className="d-inline-flex align-items-center gap-2"><CountryFlag key={m.countryIso2??"none"} countryIso2={m.countryIso2}/>{m.displayName}</span></th>{roles(m).map(([name,share])=><td key={name}>{(share??0)>0?"✓":"—"}</td>)}<td aria-hidden="true">→</td></tr>)}</tbody>
  </table><button className="btn btn-primary" disabled={roster?.members.length===0} onClick={()=>setCreationOpen(true)}>+ {t("teamUX.addMember")}</button></div>}
  {creationOpen&&<div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="team-create-title" style={{background:"rgba(0,0,0,.5)"}}>
   <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
    <div className="modal-header"><h2 className="modal-title fs-5" id="team-create-title">{t("teamUX.addMember")}</h2>
     <button className="btn-close" aria-label={t("teamUX.cancel")} onClick={()=>setCreationOpen(false)}/></div>
    <form onSubmit={e=>void createOne(e)}>
     <div className="modal-body">
      <label className="form-label" htmlFor="new-team-member">{t("teamUX.memberName")}</label>
      <input id="new-team-member" className="form-control" maxLength={120} required autoFocus
       value={newName} disabled={creating}
       onChange={e=>{setNewName(e.target.value);setCreateError("");requestId.current=null;}}/>
      <p className="small text-secondary mt-2">{t("teamUX.defaultRole")}</p>
      {createError&&<p role="alert" className="alert alert-warning">{t("teamUX.createError",{reason:createError})}</p>}
     </div>
     <div className="modal-footer">
      <button type="button" className="btn btn-secondary" disabled={creating} onClick={()=>setCreationOpen(false)}>{t("teamUX.cancel")}</button>
      <button type="submit" className="btn btn-primary" disabled={creating||!newName.trim()}>{t("teamUX.create")}</button>
     </div>
    </form>
   </div></div></div>}
 </section>;
}
