import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";

export const dynamic="force-dynamic";
export default async function MaintenanceSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 const backups=canAccess(account,"read",{type:"backups",exists:true,inScope:true});
 const audit=canAccess(account,"read",{type:"audit",exists:true,inScope:true});
 if(!backups&&!audit)notFound();
 const locale=await requestLocale();
 const fr=locale==="fr";
 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">
  <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {translate(locale,"navigation.entries.settings")}</Link>
  <header className="mb-3"><h1 className="h3">{translate(locale,"settingsCatalog.items.maintenance.title")}</h1>
   <p className="text-secondary">{translate(locale,"settingsCatalog.items.maintenance.description")}</p></header>
  <nav className="nav nav-tabs mb-3" aria-label={fr?"Rubriques de maintenance":"Maintenance sections"}>
   {backups&&<Link className="nav-link" href="/app/admin/backups">{translate(locale,"settingsCatalog.items.backups.title")}</Link>}
   {audit&&<Link className="nav-link" href="/app/admin/audit">{translate(locale,"settingsCatalog.items.audit.title")}</Link>}
  </nav>
  <section className="smn-panel rounded-4 p-3">
   <h2 className="h5">{fr?"Choisir une rubrique":"Choose a section"}</h2>
   <p className="text-secondary">{fr?"Les sauvegardes et le journal d'audit conservent leurs contrôles d'accès indépendants.":"Backup and audit actions retain their separate access controls."}</p>
   <div className="d-flex flex-wrap gap-2">
    {backups&&<Link className="btn btn-primary" href="/app/admin/backups">{translate(locale,"settingsCatalog.items.backups.title")}</Link>}
    {audit&&<Link className="btn btn-outline-primary" href="/app/admin/audit">{translate(locale,"settingsCatalog.items.audit.title")}</Link>}
   </div>
  </section>
 </main>;
}
