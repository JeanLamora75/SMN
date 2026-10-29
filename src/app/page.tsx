import Link from "next/link";
import {redirect} from "next/navigation";
import {translate,type TranslationKey} from "@/i18n/catalog";
import {requestLocale} from "@/i18n/locale.server";
import {currentInstallationDiagnostic} from "@/server/installation/current";
import {canVisitSetup} from "@/server/access-policy";
import {canOfferPortable} from "@/server/bootstrap/portable";

export const dynamic="force-dynamic";
export default async function HomePage(){
  const [diagnostic,locale]=await Promise.all([currentInstallationDiagnostic(),requestLocale()]);
  if(diagnostic.status==="initialized")redirect("/login");
  const t=(key:TranslationKey)=>translate(locale,key);
  const canInstall=canOfferPortable()&&diagnostic.status!=="initialized";
  const firstRun=diagnostic.status==="configuration-missing"&&canInstall;
  const status=firstRun?t("home.firstRun"):t(
    `installation.diagnostic.${diagnostic.status}` as TranslationKey);
  return <main id="smn-main" className="smn-page container py-5">
    <header className="d-flex align-items-center gap-3 mb-5">
      <span className="smn-mark">SMN</span>
      <div>
        <h1 className="h3 mb-1">Scrum Master Notebook</h1>
        <p className="smn-subtitle mb-0">{t("home.subtitle")}</p>
      </div>
    </header>
    <section className="smn-panel p-4 p-md-5" aria-labelledby="diagnostic-heading">
      <h2 id="diagnostic-heading" className="h4 mb-3">{t("home.heading")}</h2>
      <p role="status" className="lead">{status}</p>
      <p className="smn-subtitle">{canInstall?t("home.willPrepare"):t("home.noAutoSetup")}</p>
      <div className="d-flex flex-wrap gap-2 mt-4">
        <Link className="btn btn-outline-primary" href="/">{t("home.retryDiagnostics")}</Link>
        {!canVisitSetup(diagnostic)&&<Link className="btn btn-primary" href="/login">{t("common.signIn")}</Link>}
        {firstRun?<Link className="btn btn-primary" href="/welcome">{t("home.install")}</Link>:
          canVisitSetup(diagnostic)&&<Link className="btn btn-primary" href="/welcome">{t("home.prepare")}</Link>}
      </div>
    </section>
    <p className="small smn-subtitle mt-4">{t("home.footer")}</p>
  </main>;
}
