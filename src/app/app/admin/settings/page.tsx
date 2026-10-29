import {redirect} from "next/navigation";
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
  <SettingsCatalogView groups={groups} showCompanies={account.role==="admin"}/>
 </main>;
}
