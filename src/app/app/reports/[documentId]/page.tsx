import Link from "next/link";
import ReportStudio from "../report-studio";
import ReportQualityControl from "../report-quality-control";
import ReportPdfActions from "../report-pdf-actions";
import {ReportEditingProvider} from "../report-editing-context";
import ReportDataRefresh from "../report-data-refresh";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canVisitPrivate} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readTeamStudioDocument} from "@/server/reports/team-studio";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {getReportDocument} from "@/server/reports/report-documents";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {readAnalysisJournal} from "@/server/ai-briefs/journal";
import {readTemplateUpdateOffer} from "@/server/reports/template-versioning";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic="force-dynamic";
export default async function ReportDetail({params,searchParams}:{params:Promise<{documentId:string}>;searchParams:Promise<{cycleId?:string;teamId?:string}>}){
 const account=await currentAccount();if(!account)redirect("/login");
 if(!canVisitPrivate({role:account.role,mustChangePassword:account.must_change_password}))notFound();
 const {documentId}=await params,{cycleId,teamId}=await searchParams;
 if(!cycleId||!/^[a-f0-9-]{36}$/i.test(cycleId))notFound();
 const scoped=typeof teamId==="string"&&teamId.length>0;
 if(scoped&&account.role!=="admin")notFound();
 const doc=await withSprintIndexDb(async db=>{
  if(scoped){
   const team=await resolveAdminTeam(db,{accountId:account.id,role:"admin"},teamId);
   return readTeamStudioDocument(db,{accountId:account.id,role:"admin"},team.team_id,cycleId,documentId);
  }
  await assertLegacyTeamApi(db);
  return getReportDocument(db,cycleId,documentId);
 }).catch(()=>null);
 if(!doc)notFound();
 if(teamId){
  return <main className="container-fluid px-3 px-lg-4 py-4">
   <Link href={"/app/reports?teamId="+encodeURIComponent(teamId)+"&cycleId="+encodeURIComponent(cycleId)}>Retour au Centre Rapports</Link>
   <p role="status" className="alert alert-info mt-3">Édition contextualisée par équipe : les exports PDF du Studio sont accessibles sous réserve des contrôles de qualité et de révision. Le rafraîchissement des données et l’insertion de nouvelles analyses restent désactivés.</p>
   <ReportEditingProvider initialRevision={doc.revision}>
    <ReportPdfActions sprintId={cycleId} documentId={documentId} teamId={teamId} readOnly={doc.status!=="draft"}/>
    <ReportQualityControl content={doc.content}/>
    <ReportStudio document={doc} readOnly={doc.status!=="draft"} teamId={teamId} journal={[]}/>
   </ReportEditingProvider>
  </main>;
 }
 const journal=await withSprintIndexDb(db=>readAnalysisJournal(db,doc.teamId,{cycleId})).catch(()=>[]);
 const updateOffer=await withSprintIndexDb(db=>readTemplateUpdateOffer(db,cycleId,documentId)).catch(()=>null);
 const stored=doc.content as {metrics?:Record<string,{value:number|null;unit:string}>;dataSource?:{source:string;snapshotVersion:number|null}}|null;
 const metrics=stored?.metrics??{};
 const locale=await requestLocale(),t=(k:string)=>translate(locale,("reportsCenter."+k) as "reportsCenter.heading");
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href={"/app/reports?cycleId="+encodeURIComponent(cycleId)}>{t("back")}</Link>
  <ReportEditingProvider initialRevision={doc.revision}>
  <ReportPdfActions sprintId={cycleId} documentId={documentId} readOnly={account.role!=="admin"}/>
  <ReportQualityControl content={doc.content}/>
  <ReportDataRefresh sprintId={cycleId} documentId={documentId} readOnly={account.role!=="admin"}/>
  <ReportStudio document={doc} readOnly={account.role!=="admin"} journal={journal.map(a=>({id:a.id,type:a.type,scope:a.scope,content:a.content,archiveId:a.archiveId}))}/>
  </ReportEditingProvider>
  {updateOffer?.available&&<section className="alert alert-info" aria-label={t("updateAvailable")}>
   <p className="mb-2">{t("updateAvailable")} · V{updateOffer.comparison.fromVersion} → V{updateOffer.comparison.toVersion}</p>
   <p className="small mb-0">{updateOffer.comparison.sectionsChanged?t("sectionsChanged"):""} {updateOffer.comparison.contentChanged?t("contentChanged"):""} {t("noAutoUpdate")}</p>
  </section>}

 </main>;
}
