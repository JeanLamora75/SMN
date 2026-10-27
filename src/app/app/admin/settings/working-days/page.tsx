import SettingsTabs from "../settings-tabs";
import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import WorkSlotsForm from "../../sprints/work-slots-form";
import LunchForm from "../../sprints/lunch-form";

export const dynamic="force-dynamic";

export default async function WorkingDaysSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))
  redirect("/app");
 // The underlying settings API only supports Scrum teams.
 const isScrum=await withAuthDb(async db=>{
  const result=await db.query(`SELECT 1 FROM public.smn_installation
   WHERE id='singleton' AND state='initialized' AND lower(mode)='scrum' LIMIT 1`);
  return result.rows.length===1;
 }).catch(()=>false);
 if(!isScrum)redirect("/app/admin/settings");

 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4">
  <div className="mx-auto" style={{maxWidth:1000}}>
   <header className="mb-3">
    <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">
     ← {t("navigation.entries.settings")}
    </Link>
    <h1 className="h3">{t("settingsSprint.workingDaysTitle")}</h1>
    <p className="text-secondary">{t("settingsSprint.workingDaysScope")}</p>
   </header>
  <SettingsTabs label={t("settingsSprint.workingDaysTitle")} sections={[
   {id:"slots",label:t("settingsCatalog.tabs.slots"),content:<WorkSlotsForm/>},
   {id:"lunch",label:t("settingsCatalog.tabs.lunch"),content:<LunchForm/>}
  ]}/>
  </div>
 </main>;
}
