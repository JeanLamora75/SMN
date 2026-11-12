import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import TemplateForm from "../../sprints/template-form";
import SettingsPageShell from "../settings-page-shell";

export const dynamic="force-dynamic";

export default async function CeremonyTemplatesSettingsPage(){
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
 return <SettingsPageShell title={t("settingsSprint.ceremoniesTitle")}
  description={t("settingsSprint.ceremoniesScope")}
  eyebrow={t("settingsCatalog.navigation.adminEyebrow")} constrained>
  <TemplateForm/>
 </SettingsPageShell>;
}
