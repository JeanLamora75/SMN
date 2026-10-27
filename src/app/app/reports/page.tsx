import Link from "next/link";
import TemplateLibrary from "./template-library";
import NewReportForm from "./new-report-form";
import BootstrapIcon from "../bootstrap-icon";
import {formatReportCenterDate} from "@/lib/report-center-date";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canVisitPrivate} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readCenter,readTeamCenter} from "@/server/reports/center";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import "./report-center-cockpit.css";

export const dynamic="force-dynamic";
type Params={searchParams:Promise<Record<string,string|string[]|undefined>>};
const tabs=["reports","templates","archives"] as const;

export default async function ReportsCenter({searchParams}:Params){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(!canVisitPrivate({role:account.role,mustChangePassword:account.must_change_password}))notFound();
 const params=await searchParams,one=(x:string|string[]|undefined)=>typeof x==="string"?x:"";
 const tab=tabs.includes(one(params.tab) as typeof tabs[number])?one(params.tab):"reports";
 const sprint=one(params.cycleId),search=one(params.q).toLocaleLowerCase().trim().slice(0,120);
 const status=one(params.status);
 const locale=await requestLocale(),t=(key:string)=>translate(locale,("reportsCenter."+key) as "reportsCenter.heading");
 const data=await withSprintIndexDb(async db=>{
  const version=await db.query<{schema_version:number}>(`
   SELECT schema_version FROM public.smn_installation
   WHERE id='singleton' AND state='initialized'`);
  const schema=version.rows[0]?.schema_version;
  if(schema===28){
   if(account.role!=="admin"||Array.isArray(params.teamId))
    throw Error("report-team-forbidden");
   const team=await resolveAdminTeam(db,
    {accountId:account.id,role:account.role},
    one(params.teamId)||null);
   return {...await readTeamCenter(db,team),
    teamId:team.team_id,scope:"team" as const};
  }
  if(typeof schema!=="number"||!Number.isSafeInteger(schema)||schema<1||schema>27)
   throw Error("report-schema-not-ready");
  return {...await readCenter(db,account.role==="admin"?"admin":"user",account.id),
   teamId:null,scope:"legacy" as const};
 }).catch(()=>null);
 if(!data)return <main className="container-fluid px-3 px-lg-4 py-4"><h1>{t("heading")}</h1><p role="alert" className="alert alert-danger">{t("error")}</p><Link href="/app/reports">{t("retry")}</Link></main>;
 const scoped=data.scope==="team";
 const docs=data.documents.filter(d=>(!sprint||d.sprintId===sprint)&&(!status||d.status===status)&&(!search||[d.title,d.sprintName,d.templateId].some(v=>v.toLocaleLowerCase().includes(search))));
 const archiveItems=data.archives.filter(a=>(!sprint||a.cycleId===sprint)&&(!search||a.cycleName.toLocaleLowerCase().includes(search)));
 const href=(next:string)=>{
  const qs=new URLSearchParams();qs.set("tab",next);
  if(sprint)qs.set("cycleId",sprint);
  if(search)qs.set("q",search);
  if(status)qs.set("status",status);
  if(data.teamId)qs.set("teamId",data.teamId);
  return "/app/reports?"+qs.toString();
 };
 const sprintOptions=data.cycles.map(c=>[c.id,c.name] as [string,string]);
 const count=tab==="reports"?docs.length:tab==="archives"?archiveItems.length:null;
 return <main className="smn-report-cockpit container-fluid px-3 px-lg-4 py-4">
  <header className="smn-report-hero">
   <div className="smn-report-hero-top">
    <div className="smn-report-hero-identity">
     <h1>{t("heading")}</h1><p>{t("heroIntro")}</p>
    </div>
    {account.role==="admin"&&!scoped&&<NewReportForm cycles={sprintOptions} templates={data.templates} preferredCycle={sprint}/>}
   </div>
   <nav className="smn-report-tabs" aria-label={t("heading")}>
    {tabs.map(k=><Link key={k} href={href(k)} className={"smn-report-tab"+(tab===k?" is-active":"")} aria-current={tab===k?"page":undefined}>
     <BootstrapIcon name={k==="reports"?"list-ul":k==="templates"?"grid-3x3-gap":"sticky-fill"}/>
     {t(k)}{k==="reports"&&<span className="smn-report-tab-count">{data.documents.length}</span>}
    </Link>)}
   </nav>
  </header>
  {tab!=="templates"&&<section className="smn-report-filters" aria-labelledby="smn-report-filters-title">
   <div className="smn-report-panel-heading">
    <h2 id="smn-report-filters-title"><BootstrapIcon name="sliders"/>{t("filtersHeading")}</h2>
    {count!==null&&<span className="smn-report-count">{count} {count===1?t("reportCountOne"):t("reportCountMany")}</span>}
   </div>
   <form method="get" className="smn-report-filter-grid">
    <input type="hidden" name="tab" value={tab}/>
    {data.teamId&&<input type="hidden" name="teamId" value={data.teamId}/>}
    <label className="smn-report-search">{t("search")}<input className="form-control" type="search" name="q" defaultValue={one(params.q)} placeholder={t("searchPlaceholder")} maxLength={120}/></label>
    <label>{t("sprint")}<select className="form-select" name="cycleId" defaultValue={sprint}><option value="">{t("all")}</option>{sprintOptions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    {tab==="reports"&&<label>{t("status")}<select className="form-select" name="status" defaultValue={status}><option value="">{t("all")}</option><option value="draft">{t("draft")}</option></select></label>}
    <div className="smn-report-filter-actions">
     <button className="btn btn-primary" type="submit">{t("filter")}</button>
     <Link className="btn btn-outline-secondary" href={"/app/reports?tab="+encodeURIComponent(tab)+(data.teamId?"&teamId="+encodeURIComponent(data.teamId):"")}>{t("clearFilters")}</Link>
    </div>
   </form>
  </section>}
  {tab==="reports"&&<section className="smn-report-results" aria-labelledby="smn-report-results-title">
   <div className="smn-report-panel-heading">
    <h2 id="smn-report-results-title">{t("listHeading")}</h2>
    <span className="smn-report-results-count">{docs.length} {docs.length===1?t("reportCountOne"):t("reportCountMany")}</span>
   </div>
   {docs.length===0?<p className="alert alert-info mb-0">{t("emptyReports")}</p>:
   <div className="table-responsive">
    <table className="table table-hover align-middle smn-report-table">
     <thead><tr><th scope="col">{t("reports")}</th><th scope="col">{t("sprint")}</th><th scope="col">{t("model")}</th><th scope="col">{t("status")}</th><th scope="col">{t("updated")}</th><th scope="col">{t("actions")}</th></tr></thead>
     <tbody>{docs.map(d=><tr key={d.id}>
      <td><div className="smn-report-document-cell"><span className="smn-report-document-icon" aria-hidden="true"><BootstrapIcon name="list-ul"/></span><div><Link className="smn-report-document-title" href={"/app/reports/"+encodeURIComponent(d.id)+"?cycleId="+encodeURIComponent(d.sprintId)+(data.teamId?"&teamId="+encodeURIComponent(data.teamId):"")}>{d.title}</Link><small>{d.sprintName}</small></div></div></td>
      <td>{d.sprintName}</td><td>{d.templateId} · V{d.templateVersion}</td>
      <td><span className="smn-report-status">{t("draft")}</span></td>
      <td><time dateTime={d.updatedAt}>{formatReportCenterDate(d.updatedAt,locale)}</time></td>
      <td><Link className="btn btn-sm btn-outline-primary" href={"/app/reports/"+encodeURIComponent(d.id)+"?cycleId="+encodeURIComponent(d.sprintId)+(data.teamId?"&teamId="+encodeURIComponent(data.teamId):"")} aria-label={t("read")+" : "+d.title}>{t("read")}</Link></td>
     </tr>)}</tbody>
    </table>
   </div>}
  </section>}
  {tab==="templates"&&<section className="smn-report-results" aria-labelledby="smn-report-templates-title">
   <div className="smn-report-panel-heading"><h2 id="smn-report-templates-title">{t("templates")}</h2></div>
   {data.templates.length===0?<p className="alert alert-info mb-0">{t("emptyModels")}</p>:<TemplateLibrary templates={data.templates} canManage={account.role==="admin"&&!scoped}/>}
  </section>}
  {tab==="archives"&&<section className="smn-report-results" aria-labelledby="smn-report-archives-title">
   <div className="smn-report-panel-heading"><h2 id="smn-report-archives-title">{t("archives")}</h2></div>
   {archiveItems.length===0?<p className="alert alert-info mb-0">{t("emptyArchives")}</p>:
   <div className="table-responsive"><table className="table table-hover align-middle smn-report-table smn-report-archives-table"><thead><tr><th scope="col">{t("sprint")}</th><th scope="col">{t("updated")}</th><th scope="col">{t("actions")}</th></tr></thead>
    <tbody>{archiveItems.map(a=><tr key={a.id}><td>{a.cycleName}</td><td><time dateTime={a.createdAt}>{formatReportCenterDate(a.createdAt,locale)}</time></td>
     <td><a className="btn btn-sm btn-outline-primary" href={"/api/admin/reports/archives/"+encodeURIComponent(a.id)+"/download"+(data.teamId?"?teamId="+encodeURIComponent(data.teamId):"")}>{t("download")}</a></td></tr>)}</tbody>
   </table></div>}
  </section>}
 </main>;
}
