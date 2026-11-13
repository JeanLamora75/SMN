import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import TemplateForm from "../../sprints/template-form";
import TemplateCreateButton from "./template-create-button";
import "./ceremony-templates-cockpit.css";
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
  const result=await db.query(`SELECT 1 FROM public.smn_installation i
   WHERE i.id='singleton' AND i.state='initialized'
   AND (
    lower(to_jsonb(i)->>'mode')='scrum'
    OR EXISTS (
     SELECT 1 FROM public.smn_team t WHERE t.installation_id=i.id
     AND lower(COALESCE(to_jsonb(t)->>'agile_mode',''))='scrum'
     AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
    )
   ) LIMIT 1`);
  return result.rows.length===1;
 }).catch(()=>false);
 if(!isScrum)redirect("/app/admin/settings");

 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 return <SettingsPageShell title={t("settingsSprint.ceremoniesTitle")}
  description={t("settingsSprint.ceremoniesScope")}
  eyebrow={t("settingsCatalog.navigation.adminEyebrow")}
  action={<TemplateCreateButton/>}>
  <TemplateForm/>
 </SettingsPageShell>;
}
