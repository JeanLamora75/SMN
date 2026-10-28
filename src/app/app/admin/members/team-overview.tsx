"use client";
import Link from "next/link";
import NeutralAvatar from "./neutral-avatar";
import CountryFlag from "./country-flag";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import TeamContextEditor from "./team-context-editor";
import BootstrapIcon from "../../bootstrap-icon";
import {availableFunctions,filterTeamMembers,initialTeamFilters,type TeamFilters} from "./team-cockpit-filter";

type Member={id:string;companyId?:string|null;companyName?:string|null;companyColor?:string|null;displayName:string;countryIso2:string|null;professionalFunction?:string|null;isProvisional:boolean;memberNumber:number;archived:boolean;isAssigned:boolean;roleShares:{scrumMaster:number;productOwner:number;developer:number}};
type CompanyChoice={id:string;name:string;archivedAt:string|null};
type Roster={team:{id:string;name:string;mode:string};members:Member[]};
type TeamContextOverview={teamId:string;name:string;productName:string;
 vision:string|null;productGoal:string|null;revision:number};
type TeamContextState=
 |{status:"loading"}|{status:"error"}|{status:"ready";value:TeamContextOverview};
type View="cards"|"list";
type FilterState={scope:string;draft:TeamFilters;applied:TeamFilters};
const CHOICE="smn-team-roster-view";
export default function TeamOverview({canManage,initialTeamId=null}:{canManage:boolean;initialTeamId?:string|null}){
 const t=useTranslation();
 const router=useRouter();
 const [roster,setRoster]=useState<Roster|null>(null);
 const [teamContext,setTeamContext]=useState<TeamContextState>({status:"loading"});
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [view,setView]=useState<View>("cards");
 const [filters,setFilters]=useState<FilterState>({scope:"",draft:initialTeamFilters,applied:initialTeamFilters});
 const [creationOpen,setCreationOpen]=useState(false);
 const [newName,setNewName]=useState("");
 const [newCompanyId,setNewCompanyId]=useState("");
 const [companyChoices,setCompanyChoices]=useState<CompanyChoice[]>([]);
 const [companyEnabled,setCompanyEnabled]=useState(false);
 const [creating,setCreating]=useState(false);
 const [createError,setCreateError]=useState("");
 const requestId=useRef<string|null>(null);
 useEffect(()=>{let live=true;void fetch("/api/admin/companies",{cache:"no-store"})
 .then(async r=>{if(!r.ok)throw Error("company-catalog");return r.json() as Promise<{companies:CompanyChoice[]}>;})
 .then(data=>{if(live){setCompanyChoices(data.companies.filter(c=>!c.archivedAt));setCompanyEnabled(true);}})
 .catch(()=>{if(live)setCompanyChoices([]);});return()=>{live=false};},[]);
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
    body:JSON.stringify({teamId:roster.team.id,displayName:newName.trim(),...(companyEnabled?{companyId:newCompanyId||null}:{}),requestId:requestId.current})});
   const body=await r.json() as {error?:string};
   if(!r.ok)throw Error(body.error??"service");
   const refreshed=await fetch("/api/admin/members"+(initialTeamId?"?"+new URLSearchParams({teamId:initialTeamId}):""),{cache:"no-store"});
   if(!refreshed.ok)throw Error("refresh-failed");
   setRoster(await refreshed.json() as Roster);
   setCreationOpen(false);setNewName("");setNewCompanyId("");requestId.current=null;
  }catch(err){setCreateError(err instanceof Error?err.message:"service");}
  finally{setCreating(false);}
 }

 const scope=roster?.team.id??"";
 const draftFilters=filters.scope===scope?filters.draft:initialTeamFilters;
 const appliedFilters=filters.scope===scope?filters.applied:initialTeamFilters;
 function updateFilter<K extends keyof TeamFilters>(key:K,value:TeamFilters[K]){setFilters({scope,draft:{...draftFilters,[key]:value},applied:appliedFilters});}
 function applyFilters(e:FormEvent<HTMLFormElement>){e.preventDefault();setFilters({scope,draft:draftFilters,applied:{...draftFilters}});}
 function resetFilters(){setFilters({scope,draft:{...initialTeamFilters},applied:{...initialTeamFilters}});}
 const allMembers=roster?.members??[];
 const activeCount=allMembers.filter(m=>!m.archived).length;
 const members=filterTeamMembers(allMembers,appliedFilters);
 const canAdd=canManage&&allMembers.length>0;
 const functions=availableFunctions(allMembers);
 const hasArchived=allMembers.some(m=>m.archived);
 const hasProvisional=allMembers.some(m=>m.isProvisional&&!m.archived);
 const capacity=Math.max(12,Math.ceil((members.length+(canAdd?1:0))/6)*6);
 const roles=(m:Member)=>([["SM",m.roleShares?.scrumMaster],["PO",m.roleShares?.productOwner],["Dev",m.roleShares?.developer]] as const);
 const memberHref=(m:Member)=>"/app/admin/members/"+encodeURIComponent(m.id)+(roster?.team.id?"?"+new URLSearchParams({teamId:roster.team.id}):"");
 const memberStatus=(m:Member)=>m.archived?t("teamCockpit.archived"):m.isProvisional?t("teamCockpit.provisional"):t("teamCockpit.active");
 const roleBadge=(name:"SM"|"PO"|"Dev",share:number|undefined)=><span key={name} className={"smn-team-role "+((share??0)>0?"smn-team-role-active":"smn-team-role-inactive")} title={t((share??0)>0?"teamCockpit.roleActive":"teamCockpit.roleInactive",{role:name})}>{name}</span>;
 const currentContext=teamContext.status==="ready"&&
  teamContext.value.teamId===roster?.team.id?teamContext.value:null;
 const contextText=(value:string|null|undefined)=>teamContext.status==="loading"?
  t("teamUX.contextPreviewLoading"):teamContext.status==="error"?
  t("teamUX.contextPreviewUnavailable"):value?.trim()||
  t("teamUX.contextPreviewEmpty");
 return <section className="smn-team-cockpit d-grid gap-3">
  <header className="smn-team-hero">
   <div className="smn-team-hero-identity"><div className="d-flex align-items-center gap-2">
    <h1>{roster?.team.name??t("teamCockpit.title")}</h1>
    {canManage&&roster&&<TeamContextEditor teamId={roster.team.id} teamName={roster.team.name} onSaved={updated=>{
     setRoster(current=>current&&current.team.id===updated.teamId?{...current,team:{...current.team,name:updated.name}}:current);
     setTeamContext({status:"ready",value:updated});
    }}/>}
   </div></div>
   <div className="smn-team-hero-context" aria-label={t("teamUX.contextOverview")}>
    <section className="smn-team-hero-info"><span className="smn-team-hero-icon" aria-hidden="true"><BootstrapIcon name="bullseye"/></span>
     <div className="smn-team-hero-copy"><h2>{t("teamUX.contextVision")}</h2><p>{contextText(currentContext?.vision)}</p></div>
    </section>
    <section className="smn-team-hero-info"><span className="smn-team-hero-icon" aria-hidden="true"><BootstrapIcon name="stack"/></span>
     <div className="smn-team-hero-copy"><h2>{t("teamUX.contextGoalHeading")}</h2><p>{contextText(currentContext?.productGoal)}</p></div>
    </section>
   </div>
   <div className="smn-team-hero-actions">
    <div className="smn-team-view-switch" role="group" aria-label={t("teamUX.displayMode")}>
     <button type="button" className="btn smn-team-view-button" aria-pressed={view==="list"} onClick={()=>choose("list")}><BootstrapIcon name="list-ul"/><span>{t("teamCockpit.list")}</span></button>
     <button type="button" className="btn smn-team-view-button" aria-pressed={view==="cards"} onClick={()=>choose("cards")}><BootstrapIcon name="grid-3x3-gap"/><span>{t("teamCockpit.cards")}</span></button>
    </div>
    {canAdd&&<button type="button" className="btn smn-team-create" onClick={()=>setCreationOpen(true)}><span aria-hidden="true" className="smn-team-plus">+</span>{t("teamUX.addMember")}</button>}
   </div>
  </header>
  <section className="smn-team-filter-panel" aria-labelledby="smn-team-filter-heading">
   <div className="smn-team-panel-heading">
    <h2 id="smn-team-filter-heading"><BootstrapIcon name="sliders"/>{t("teamCockpit.filtersHeading")}</h2>
    <div className="smn-team-context-pills" aria-label={t("teamCockpit.context")}>
     <span><BootstrapIcon name="people-fill"/>{t("teamCockpit.teamLabel")}: <strong>{roster?.team.name??"—"}</strong></span>
     <span><BootstrapIcon name="grid-3x3-gap"/>{t("teamCockpit.viewLabel")}: <strong>{t(view==="cards"?"teamCockpit.cards":"teamCockpit.list")}</strong></span>
     <span><BootstrapIcon name="people-fill"/>{t("teamCockpit.displayCount",{count:members.length})}</span>
     {status==="ready"&&activeCount!==members.length&&<span>{t("teamUX.activeCount",{count:activeCount})}</span>}
    </div>
   </div>
   <form onSubmit={applyFilters} className="smn-team-filter-grid">
    <div className="smn-team-search-field"><label htmlFor="smn-team-search" className="form-label">{t("teamCockpit.searchLabel")}</label>
     <input id="smn-team-search" type="search" className="form-control" value={draftFilters.search} onChange={e=>updateFilter("search",e.target.value)} placeholder={t("teamCockpit.searchPlaceholder")} maxLength={160}/></div>
    <div><label htmlFor="smn-team-role-filter" className="form-label">{t("teamCockpit.roleLabel")}</label>
     <select id="smn-team-role-filter" className="form-select" value={draftFilters.role} onChange={e=>updateFilter("role",e.target.value as TeamFilters["role"])}>
      <option value="all">{t("teamCockpit.allRoles")}</option><option value="sm">{t("teamCockpit.scrumMaster")}</option><option value="po">{t("teamCockpit.productOwner")}</option><option value="dev">{t("teamCockpit.developer")}</option>
     </select></div>
    <div><label htmlFor="smn-team-function-filter" className="form-label">{t("teamCockpit.functionLabel")}</label>
     <select id="smn-team-function-filter" className="form-select" value={functions.includes(draftFilters.functionName)?draftFilters.functionName:"all"} onChange={e=>updateFilter("functionName",e.target.value)}>
      <option value="all">{t("teamCockpit.allFunctions")}</option>{functions.map(value=><option value={value} key={value}>{value}</option>)}
     </select></div>
    <div><label htmlFor="smn-team-status-filter" className="form-label">{t("teamCockpit.statusLabel")}</label>
     <select id="smn-team-status-filter" className="form-select" value={draftFilters.status} onChange={e=>updateFilter("status",e.target.value as TeamFilters["status"])}>
      <option value="active">{t("teamCockpit.activeMembers")}</option><option value="all">{t("teamCockpit.allAvailable")}</option>
      {hasProvisional&&<option value="provisional">{t("teamCockpit.provisional")}</option>}{hasArchived&&<option value="archived">{t("teamCockpit.archived")}</option>}
     </select></div>
    <div className="smn-team-filter-actions">
     <button className="btn btn-outline-primary" type="submit">{t("teamCockpit.filterButton")}</button>
     <button className="btn btn-outline-secondary" type="button" onClick={resetFilters}>{t("teamCockpit.resetButton")}</button>
    </div>
   </form>
  </section>

  <section className="smn-team-results" aria-label={t("teamCockpit.membersHeading")}>
   {status==="loading"&&<p role="status">{t("members.loading")}</p>}
   {status==="error"&&<p role="alert">{t("members.loadFailed")}</p>}
   {status==="ready"&&roster?.members.length===0&&
    <div className="alert alert-info mb-0">{t("teamUX.notInitialized")}{" "}
     {canManage&&<Link href="/app/admin/members/manage" className="alert-link">
      {t("teamUX.initialize")}</Link>}
    </div>}
   {status==="ready"&&roster&&roster.members.length>0&&<>
    {members.length===0&&<p role="status" className="smn-team-no-results">
     {t("teamCockpit.noResults")}
    </p>}
    {view==="cards"?
     <div className="smn-team-member-grid">
      {Array.from({length:capacity},(_,index)=>{
       const member=members[index];
       return member?
        <Link key={member.id} href={memberHref(member)}
         className="smn-team-member-card text-decoration-none"
         aria-label={t("teamUX.openMember",{name:member.displayName})}>
         <div className="smn-team-member-name">
          <CountryFlag countryIso2={member.countryIso2}/>
          <strong>{member.displayName}</strong>{member.companyName&&<span className="d-block small text-secondary" title="Entreprise">Entreprise : {member.companyName}</span>}
         </div>
         <NeutralAvatar size={60}/>
         <div className="smn-team-member-roles">
          {roles(member).map(([name,share])=>roleBadge(name,share))}
         </div>
         <p className="smn-team-member-function">
          {member.professionalFunction?.trim()||t("teamUX.functionMissing")}
         </p>
         {member.archived&&<span className="smn-team-member-status">
          {t("teamCockpit.archived")}</span>}
         {!member.archived&&member.isProvisional&&<span className="smn-team-member-status">
          {t("teamCockpit.provisional")}</span>}
        </Link>:canAdd&&index===members.length?
        <button key={"slot-"+index} type="button"
         className="smn-team-add-tile" onClick={()=>setCreationOpen(true)}>
         <span aria-hidden="true" className="smn-team-plus">+</span><strong>{t("teamUX.addMember")}</strong>
        </button>:
        <div key={"slot-"+index} className="smn-team-empty-slot" aria-hidden="true"/>;
      })}
     </div>:
     <div className="smn-team-list-table-wrapper">
      <table className="table table-hover align-middle smn-team-list-table">
       <thead><tr>
        <th scope="col">{t("teamUX.member")}</th>
        <th scope="col">{t("teamUX.roles")}</th>
        <th scope="col">{t("teamCockpit.functionLabel")}</th>
        <th scope="col">{t("teamCockpit.statusLabel")}</th>
        <th scope="col">{t("teamUX.details")}</th>
       </tr></thead>
       <tbody>{members.map(member=><tr key={member.id}
        role="link" tabIndex={0} className="smn-team-list-row"
        aria-label={t("teamUX.openMember",{name:member.displayName})}
        onClick={()=>router.push(memberHref(member))}
        onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){
         e.preventDefault();router.push(memberHref(member));
        }}}>
        <th scope="row"><span className="smn-team-list-name">
         <CountryFlag countryIso2={member.countryIso2}/>{member.displayName}{member.companyName&&<span className="ms-2 small text-secondary">· {member.companyName}</span>}
        </span></th>
        <td><div className="smn-team-member-roles">
         {roles(member).map(([name,share])=>roleBadge(name,share))}
        </div></td>
        <td>{member.professionalFunction?.trim()||t("teamUX.functionMissing")}</td>
        <td>{memberStatus(member)}</td>
        <td><BootstrapIcon name="arrow-right"/></td>
       </tr>)}</tbody>
      </table>
      {canAdd&&<button type="button" className="btn btn-outline-primary mt-2"
       onClick={()=>setCreationOpen(true)}>
       <span aria-hidden="true" className="smn-team-plus">+</span> {t("teamUX.addMember")}
      </button>}
     </div>}
   </>}
  </section>

  {creationOpen&&canAdd&&<div className="modal d-block" role="dialog"
   aria-modal="true" aria-labelledby="team-create-title"
   style={{background:"rgba(0,0,0,.5)"}}>
   <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
    <div className="modal-header"><h2 className="modal-title fs-5" id="team-create-title">
     {t("teamUX.addMember")}</h2>
     <button className="btn-close" aria-label={t("teamUX.cancel")}
      onClick={()=>setCreationOpen(false)}/></div>
    <form onSubmit={e=>void createOne(e)}>
     <div className="modal-body">
      <label className="form-label" htmlFor="new-team-member">{t("teamUX.memberName")}</label>
      <input id="new-team-member" className="form-control"
       maxLength={120} required autoFocus value={newName} disabled={creating}
       onChange={e=>{setNewName(e.target.value);setCreateError("");requestId.current=null;}}/>
      {companyEnabled&&<><label className="form-label mt-3" htmlFor="new-member-company">Entreprise (facultatif)</label>
      <select id="new-member-company" className="form-select" value={newCompanyId} disabled={creating}
       onChange={e=>{setNewCompanyId(e.target.value);requestId.current=null;}}>
       <option value="">Aucune entreprise</option>
       {companyChoices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select></>}
      <p className="small text-secondary mt-2">{t("teamUX.defaultRole")}</p>
      {createError&&<p role="alert" className="alert alert-warning">
       {t("teamUX.createError",{reason:createError})}</p>}
     </div>
     <div className="modal-footer">
      <button type="button" className="btn btn-secondary" disabled={creating}
       onClick={()=>setCreationOpen(false)}>{t("teamUX.cancel")}</button>
      <button type="submit" className="btn btn-primary"
       disabled={creating||!newName.trim()}>{t("teamUX.create")}</button>
     </div>
    </form>
   </div></div>
  </div>}
 </section>;
}
