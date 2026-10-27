import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";

export const dynamic="force-dynamic";
export default async function HolidaysClosuresSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const fr=locale==="fr";
 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">
  <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {translate(locale,"navigation.entries.settings")}</Link>
  <header className="mb-3"><h1 className="h3">{translate(locale,"settingsCatalog.items.holidaysClosures.title")}</h1>
   <p className="text-secondary">{translate(locale,"settingsCatalog.items.holidaysClosures.description")}</p></header>
  <nav className="nav nav-tabs mb-3" aria-label={fr?"Rubriques des calendriers":"Calendar settings sections"}>
   <Link className="nav-link" href="/app/admin/countries">{translate(locale,"settingsCatalog.items.countries.title")}</Link>
   <Link className="nav-link" href="/app/admin/company-closures">{translate(locale,"settingsCatalog.items.closures.title")}</Link>
  </nav>
  <section className="smn-panel rounded-4 p-3">
   <h2 className="h5">{fr?"Choisir une rubrique":"Choose a section"}</h2>
   <p className="text-secondary">{fr?"Les deux rubriques conservent leurs formulaires et autorisations indépendants.":"Each section retains its independent forms and permissions."}</p>
   <div className="d-flex flex-wrap gap-2">
    <Link className="btn btn-primary" href="/app/admin/countries">{translate(locale,"settingsCatalog.items.countries.title")}</Link>
    <Link className="btn btn-outline-primary" href="/app/admin/company-closures">{translate(locale,"settingsCatalog.items.closures.title")}</Link>
   </div>
  </section>
 </main>;
}
