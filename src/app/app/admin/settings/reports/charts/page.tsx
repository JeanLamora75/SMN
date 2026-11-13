import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import ChartStyleGallery from "./style-gallery";
import SettingsPageShell from "../../settings-page-shell";
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
 return <SettingsPageShell
  eyebrow={t("settingsCatalog.navigation.chartEyebrow")}
  title={t("chartStyles.gallery.heading")}
  description={t("chartStyles.gallery.intro")}>
  <div className="smn-chart-style-page">
   <ChartStyleGallery isAdmin={actor.role==="admin"}/>
  </div>
 </SettingsPageShell>;
}
