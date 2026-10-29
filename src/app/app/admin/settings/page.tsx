import {redirect} from "next/navigation";
import Link from "next/link";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {withAuthDb} from "@/server/auth/database";
import {settingsCatalog} from "@/lib/settings-catalog";
import SettingsCatalogView from "./settings-catalog-view";
export const dynamic="force-dynamic";
export default async function SettingsPortalPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 const mode=await withAuthDb(async db=>{
  const result=await db.query<{mode:string}>(`SELECT mode FROM public.smn_installation
   WHERE id='singleton' AND state='initialized' LIMIT 1`);
  const value=result.rows[0]?.mode;
  return value==="scrum"||value==="kanban"?value:null;
 }).catch(()=>null);
 const groups=settingsCatalog(mode,account);
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4">
  <header className="mb-4">
   <h1 className="h3">{t("navigation.entries.settings")}</h1>
   <p className="text-secondary">{t("settingsPortal.subtitle")}</p>
  </header>
  {account.role==="admin"&&<section className="mb-4" aria-labelledby="smn-settings-companies-title">
   <h2 className="h5 mb-3" id="smn-settings-companies-title">Entreprises</h2>
   <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3">
    <div className="col">
     <Link className="smn-panel rounded-4 p-3 h-100 d-flex gap-3 align-items-start text-body text-decoration-none smn-settings-entry-link"
      href="/app/admin/companies">
      <span className="fs-4 flex-shrink-0" aria-hidden="true">▤</span>
      <span className="d-flex flex-column align-items-start gap-2 flex-grow-1">
       <span className="fw-semibold">Gestion des entreprises</span>
       <span className="text-secondary small w-100">Consulter et gérer les entreprises de l’organisation.</span>
       <span className="small text-secondary">Disponible</span>
      </span>
     </Link>
    </div>
    <div className="col">
     <Link className="smn-panel rounded-4 p-3 h-100 d-flex gap-3 align-items-start text-body text-decoration-none smn-settings-entry-link"
      href="/app/admin/company-closures">
      <span className="fs-4 flex-shrink-0" aria-hidden="true">▦</span>
      <span className="d-flex flex-column align-items-start gap-2 flex-grow-1">
       <span className="fw-semibold">Fermetures d’entreprise</span>
       <span className="text-secondary small w-100">Consulter et gérer les périodes de fermeture des entreprises.</span>
       <span className="small text-secondary">Disponible</span>
      </span>
     </Link>
    </div>
   </div>
  </section>}
  <SettingsCatalogView groups={groups}/>
 </main>;
}
