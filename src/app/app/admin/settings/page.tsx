import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic="force-dynamic";
/** SMN-224: secured landing page; catalogue and view switcher are SMN-225/226. */
export default async function SettingsPortalPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4">
  <header className="mb-4">
   <h1 className="h3">{t("navigation.entries.settings")}</h1>
   <p className="text-secondary">{t("settingsPortal.subtitle")}</p>
  </header>
  <section aria-labelledby="settings-general-heading">
   <h2 className="h5" id="settings-general-heading">{t("settingsPortal.groupGeneral")}</h2>
   <div className="row g-3">
    <div className="col-12 col-md-6 col-xl-3">
     <Link href="/app/admin/settings/general" className="smn-panel p-3 h-100 d-flex gap-3 text-decoration-none text-body align-items-start">
      <span className="fs-4" aria-hidden="true">⚙</span>
      <span><strong className="d-block">{t("settingsPortal.general")}</strong>
       <span className="d-block small text-secondary mt-1">{t("settingsPortal.generalDescription")}</span></span>
     </Link>
    </div>
   </div>
  </section>
 </main>;
}
