import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {readInstalledTeamDetail} from "@/server/dashboard/team-detail";
import {safeDashboardReturn,requestedHistoricalContext} from "@/lib/context-navigation";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";

export const dynamic="force-dynamic";

/** Une URL directe reste soumise à la session et au périmètre effectif en base. */
export default async function TeamDetailPage({params,searchParams}:{
  params:Promise<{id:string}>;
  searchParams:Promise<{returnTo?:string|string[]}>;
}){
  const account=await currentAccount();
  if(!account)redirect("/login");
  if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))notFound();
  const {id}=await params;
  const team=await readInstalledTeamDetail(id).catch(()=>null);
  if(!team)notFound();
  const request=await searchParams;
  const returnTo=safeDashboardReturn(request.returnTo,team.teamId);
  const historical=requestedHistoricalContext(returnTo);
  const locale=await requestLocale();
  const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);

  return <div className="smn-page py-4">
    <nav aria-label={t("detail.breadcrumbLabel")} className="mb-3">
      <Link href={returnTo} className="smn-context-back">← {t("detail.back")}</Link>
    </nav>
    <div className="smn-eyebrow">{t("detail.teamEyebrow")}</div>
    <h1 className="h2 fw-bold mb-2">{team.team}</h1>
    <p className="text-secondary">{t("detail.subtitle")}</p>
    {historical&&<div role="note" className="alert alert-warning">
      <strong>{t("detail.historicalTitle")}</strong>
      <p className="mb-0">{t("detail.historicalNotice")}</p>
    </div>}
    <section className="smn-panel p-4" aria-label={t("detail.currentHeading")}>
      <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
        <h2 className="h5 mb-0">{t("detail.currentHeading")}</h2>
        <span className="smn-not-available">{t("detail.currentLabel")}</span>
      </div>
      <dl className="row mt-4 mb-0">
        <dt className="col-sm-4">{t("detail.teamName")}</dt>
        <dd className="col-sm-8">{team.team}</dd>
        <dt className="col-sm-4">{t("detail.productName")}</dt>
        <dd className="col-sm-8">{team.product}</dd>
        <dt className="col-sm-4">{t("detail.agileMode")}</dt>
        <dd className="col-sm-8">{t(team.mode==="scrum"?"navigation.modes.scrum":"navigation.modes.kanban")}</dd>
      </dl>
      <p className="small text-secondary mt-3 mb-0">{t("detail.identifierInfo")}</p>
    </section>
    <div className="mt-4">
      <Link href={returnTo} className="btn btn-outline-primary">{t("detail.back")}</Link>
    </div>
  </div>;
}
