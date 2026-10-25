import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canVisitPrivate} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {getReportDocument} from "@/server/reports/report-documents";
import {readTemplateUpdateOffer} from "@/server/reports/template-versioning";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic="force-dynamic";
export default async function ReportDetail({params,searchParams}:{params:Promise<{documentId:string}>;searchParams:Promise<{cycleId?:string}>}){
 const account=await currentAccount();if(!account)redirect("/login");
 if(!canVisitPrivate({role:account.role,mustChangePassword:account.must_change_password}))notFound();
 const {documentId}=await params,{cycleId}=await searchParams;
 if(!cycleId||!/^[a-f0-9-]{36}$/i.test(cycleId))notFound();
 const doc=await withSprintIndexDb(db=>getReportDocument(db,cycleId,documentId)).catch(()=>null);
 if(!doc)notFound();
 const updateOffer=await withSprintIndexDb(db=>readTemplateUpdateOffer(db,cycleId,documentId)).catch(()=>null);
 const locale=await requestLocale(),t=(k:string)=>translate(locale,("reportsCenter."+k) as "reportsCenter.heading");
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href={"/app/reports?cycleId="+encodeURIComponent(cycleId)}>{t("back")}</Link>
  <h1 className="h4 mt-3">{doc.title}</h1>
  <dl className="row">
   <dt className="col-sm-3">{t("status")}</dt><dd className="col-sm-9">{t("draft")}</dd>
   <dt className="col-sm-3">{t("model")}</dt><dd className="col-sm-9">{doc.templateId} · V{doc.templateVersion}</dd>
   <dt className="col-sm-3">{t("updated")}</dt><dd className="col-sm-9">{doc.updatedAt}</dd>
  </dl>
  {updateOffer?.available&&<section className="alert alert-info" aria-label={t("updateAvailable")}>
   <p className="mb-2">{t("updateAvailable")} · V{updateOffer.comparison.fromVersion} → V{updateOffer.comparison.toVersion}</p>
   <p className="small mb-0">{updateOffer.comparison.sectionsChanged?t("sectionsChanged"):""} {updateOffer.comparison.contentChanged?t("contentChanged"):""} {t("noAutoUpdate")}</p>
  </section>}
  <p className="alert alert-info">{t("studioLater")}</p>
 </main>;
}
