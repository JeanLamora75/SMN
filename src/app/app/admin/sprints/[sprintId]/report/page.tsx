import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {composeStandardReport} from "@/server/reports/standard-composition";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import ReportDraftNotes from "./report-draft-notes";
import ReportContentEditor from "./report-content-editor";
import ReportTeamContext from "./report-team-context";
import ReportHistoryOptions from "./report-history-options";
import ReportTemplateChooser from "./report-template-chooser";
import ReportArchiveList from "./report-archive-list";
import ReportLanguageChoice from "./report-language-choice";
import ReportLogoEditor from "./report-logo-editor";
import ReportSectionEditor from "./report-section-editor";
import ReportLinkSelection from "./report-link-selection";
import FreezeReportButton from "./freeze-report-button";
import ReportAnalysisChoices from "./report-analysis-choices";
import FactSelection from "@/app/app/admin/registries/fact-selection";
import ConfirmedHighlights from "@/app/app/admin/registries/confirmed-highlights";
export const dynamic="force-dynamic";
export default async function PrepareReportPage({params}:{params:Promise<{sprintId:string}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const {sprintId}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(sprintId))notFound();
 const data=await withSprintIndexDb(db=>composeStandardReport(db,sprintId)).catch(()=>null);
 if(!data)notFound();
 const locale=await requestLocale(),t=(key:"sprintReportPrepare.heading"|"sprintReportPrepare.provisional"|"sprintReportPrepare.final"|"sprintReportPrepare.template"|"sprintReportPrepare.objectives"|"sprintReportPrepare.empty"|"sprintReportPrepare.source"|"sprintReportPrepare.back"|"sprintReportPrepare.exportLater"|"sprintReportPrepare.dates"|"sprintReportPrepare.product"|"sprintReportPrepare.team"|"sprintReportPrepare.status")=>translate(locale,key);
 const s=data.sprint;
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <div className="d-flex flex-wrap gap-3"><Link href={"/app/admin/sprints/"+encodeURIComponent(s.id)}>{t("sprintReportPrepare.back")}</Link><Link href={"/app/reports?cycleId="+encodeURIComponent(s.id)}>{translate(locale,"navigation.entries.reporting")}</Link></div>
  <section className="smn-panel rounded-4 p-4 mt-3 d-grid gap-3">
   <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap"><h1 className="h4">{t("sprintReportPrepare.heading")}</h1><div className="d-flex flex-wrap gap-2"><Link className="btn btn-outline-secondary" href={"/app/admin/sprints/"+encodeURIComponent(s.id)+"/report/preview"}>{translate(locale,"reportPreview.open")}</Link><Link className="btn btn-outline-primary" href={"/app/admin/ai-briefs/prepare?"+new URLSearchParams({mode:"scrum",id:s.id}).toString()}>Générer un brief IA</Link><FreezeReportButton sprintId={s.id} label={translate(locale,"reportPreview.freeze")} errorLabel={translate(locale,"reportPreview.freezeError")}/></div></div>
   <div className={data.provisional?"alert alert-warning":"alert alert-info"} role="status">{data.provisional?t("sprintReportPrepare.provisional"):t("sprintReportPrepare.final")}</div>
   <dl className="row">
    <dt className="col-sm-3">Sprint</dt><dd className="col-sm-9">{s.name}</dd>
    <dt className="col-sm-3">{t("sprintReportPrepare.team")}</dt><dd className="col-sm-9">{s.team}</dd>
    <dt className="col-sm-3">{t("sprintReportPrepare.product")}</dt><dd className="col-sm-9">{s.product??"—"}</dd>
    <dt className="col-sm-3">{t("sprintReportPrepare.dates")}</dt><dd className="col-sm-9">{s.startAt} — {s.endAt} ({s.timeZone})</dd>
    <dt className="col-sm-3">{t("sprintReportPrepare.status")}</dt><dd className="col-sm-9">{s.status}</dd>
    <dt className="col-sm-3">{t("sprintReportPrepare.template")}</dt><dd className="col-sm-9">Standard</dd>
    <dt className="col-sm-3">{t("sprintReportPrepare.source")}</dt><dd className="col-sm-9">{data.source}{data.snapshotVersion?" · V"+data.snapshotVersion:""}</dd>
   </dl>
   <aside className="border rounded p-3" aria-label={translate(locale,"reportQuality.heading")}>
    <h2 className="h6">{translate(locale,"reportQuality.heading")}</h2>
    <p>{translate(locale,("reportQuality."+data.dataQuality.state) as "reportQuality.provisional")}</p>
    {data.dataQuality.snapshotVersion!==null&&<p>V{data.dataQuality.snapshotVersion} · {data.dataQuality.capturedAt}</p>}
    <dl className="row mb-0">
     <dt className="col-sm-4">{translate(locale,"reportQuality.initial")}</dt>
     <dd className="col-sm-8">{data.dataQuality.capacity.initial.quality} — {data.dataQuality.capacity.initial.source??translate(locale,"reportQuality.unknown")}</dd>
     <dt className="col-sm-4">{translate(locale,"reportQuality.actual")}</dt>
     <dd className="col-sm-8">{data.dataQuality.capacity.actual.quality} — {data.dataQuality.capacity.actual.source??translate(locale,"reportQuality.unknown")}</dd>
    </dl>
   </aside>
   <h2 className="h5">{t("sprintReportPrepare.objectives")}</h2>
   {data.goals.length?<ul>{data.goals.map(g=><li key={g.id}>{g.title} — {g.evaluation}</li>)}</ul>:<p>{t("sprintReportPrepare.empty")}</p>}
   <ReportLanguageChoice sprintId={s.id}/>
   <ReportLogoEditor sprintId={s.id}/>
   <div><Link className="btn btn-outline-secondary" href={"/app/admin/reports/archives?cycleId="+encodeURIComponent(s.id)}>{translate(locale,"archiveLibrary.openLibrary")}</Link></div>
   <ReportArchiveList sprintId={s.id}/>
   <ReportTemplateChooser sprintId={s.id}/>
   <ReportSectionEditor sprintId={s.id} sections={data.sections}/>
   <ReportLinkSelection sprintId={s.id}/>
   <ReportContentEditor sprintId={s.id} values={{committed:data.projection.scrum.storyPoints.committed.value,completed:data.projection.scrum.storyPoints.completed.value,planned:data.projection.scrum.capacity.planned.value,actual:data.projection.scrum.capacity.actual.value}} facts={[]}/>
   <FactSelection canManage={true}/>
   <ConfirmedHighlights canManage={true}/>
   <ReportHistoryOptions sprintId={s.id}/>
   <ReportAnalysisChoices sprintId={s.id}/>
   <ReportDraftNotes sprintId={s.id}/>
   <ReportTeamContext sprintId={s.id}/>
   <p className="text-secondary">{t("sprintReportPrepare.exportLater")}</p>
  </section>
 </main>;
}
