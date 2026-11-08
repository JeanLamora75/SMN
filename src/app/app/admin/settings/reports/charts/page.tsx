import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import ChartStyleGallery from "./style-gallery";
import "./style-gallery.css";

export const dynamic="force-dynamic";

/** Global administration: no team context and no report data mutation. */
export default async function ChartStylesPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 return <main className="smn-page smn-team-page smn-chart-style-page container-fluid px-3 px-lg-4 py-4">
  <nav aria-label={t("chartStyles.gallery.breadcrumb")}>
   <Link href="/app/admin/settings" className="btn btn-link px-0">{t("chartStyles.gallery.back")}</Link>
  </nav>
  <header className="smn-chart-style-hero mb-4">
   <p className="smn-chart-style-eyebrow">COCKPIT AGILE · {t("chartStyles.gallery.breadcrumb")}</p>
   <h1>{t("chartStyles.gallery.heading")}</h1>
   <p>{t("chartStyles.gallery.intro")}</p>
  </header>
  <ChartStyleGallery isAdmin={actor.role==="admin"}/>
 </main>;
}
