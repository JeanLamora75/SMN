import Link from "next/link";
import TemplateLibrary from "./template-library";
import NewReportForm from "./new-report-form";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canVisitPrivate} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readCenter,readTeamCenter} from "@/server/reports/center";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic="force-dynamic";
type Params={searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function ReportsCenter({searchParams}:Params){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(!canVisitPrivate({role:account.role,mustChangePassword:account.must_change_password}))notFound();
 const params=await searchParams,one=(x:string|string[]|undefined)=>typeof x==="string"?x:"";
 const tab=["reports","templates","archives"].includes(one(params.tab))?one(params.tab):"reports";
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
 const href=(next:string)=>{const qs=new URLSearchParams();qs.set("tab",next);if(sprint)qs.set("cycleId",sprint);if(search)qs.set("q",search);if(status)qs.set("status",status);if(data.teamId)qs.set("teamId",data.teamId);return "/app/reports?"+qs.toString();};
 const sprintOptions=data.cycles.map(c=>[c.id,c.name] as [string,string]);
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <h1 className="h4">{t("heading")}</h1><p className="text-secondary">{t("intro")}</p>
  <nav className="nav nav-tabs mb-3" aria-label={t("heading")}>
   {(["reports","templates","archives"] as const).map(k=><Link key={k} className={"nav-link"+(tab===k?" active":"")} href={href(k)} aria-current={tab===k?"page":undefined}>{t(k)}</Link>)}
  </nav>
  {tab!=="templates"&&<form method="get" className="row g-2 mb-3 align-items-end">
   <input type="hidden" name="tab" value={tab}/>
   {data.teamId&&<input type="hidden" name="teamId" value={data.teamId}/>}
   <label className="col-lg-4">{t("search")}<input className="form-control" name="q" defaultValue={one(params.q)} maxLength={120}/></label>
   <label className="col-lg-4">{t("sprint")}<select className="form-select" name="cycleId" defaultValue={sprint}><option value="">{t("all")}</option>{sprintOptions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   {tab==="reports"&&<label className="col-lg-2">{t("status")}<select className="form-select" name="status" defaultValue={status}><option value="">{t("all")}</option><option value="draft">{t("draft")}</option></select></label>}
   <div className="col-auto"><button className="btn btn-primary" type="submit">{t("filter")}</button></div>
  </form>}
  {tab==="reports"&&account.role==="admin"&&!scoped&&<NewReportForm cycles={sprintOptions} templates={data.templates} preferredCycle={sprint}/>}
  {tab==="reports"&&(docs.length===0?<p className="alert alert-info">{t("emptyReports")}</p>:<div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>{t("title")}</th><th>{t("sprint")}</th><th>{t("model")}</th><th>{t("status")}</th><th>{t("updated")}</th><th>{t("actions")}</th></tr></thead><tbody>{docs.map(d=><tr key={d.id}><td>{d.title}</td><td>{d.sprintName}</td><td>{d.templateId} · V{d.templateVersion}</td><td>{t("draft")}</td><td>{d.updatedAt}</td><td><Link href={"/app/reports/"+encodeURIComponent(d.id)+"?cycleId="+encodeURIComponent(d.sprintId)+(scoped?"&teamId="+encodeURIComponent(data.teamId??""):"")}>{t("read")}</Link></td></tr>)}</tbody></table></div>)}
  {tab==="templates"&&(data.templates.length===0?<p className="alert alert-info">{t("emptyModels")}</p>:<TemplateLibrary templates={data.templates} canManage={account.role==="admin"&&!scoped}/>)}
  {tab==="archives"&&scoped?<p className="alert alert-info">Les archives restent indisponibles tant que leur isolation par équipe n’est pas validée.</p>:null}
  {tab==="archives"&&!scoped&&(archiveItems.length===0?<p className="alert alert-info">{t("emptyArchives")}</p>:<div className="table-responsive"><table className="table"><thead><tr><th>{t("sprint")}</th><th>{t("updated")}</th><th>{t("actions")}</th></tr></thead><tbody>{archiveItems.map(a=><tr key={a.id}><td>{a.cycleName}</td><td>{a.createdAt}</td><td><a href={"/api/admin/reports/archives/"+encodeURIComponent(a.id)+"/download"}>{t("download")}</a></td></tr>)}</tbody></table></div>)}

 </main>;
}
