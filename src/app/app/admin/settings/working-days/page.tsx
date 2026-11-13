import SettingsTabs from "../settings-tabs";
import SettingsPageShell from "../settings-page-shell";
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
 const scrumTeams=await withAuthDb(async db=>{
  const result=await db.query(`SELECT 1 FROM public.smn_installation i
   WHERE i.id='singleton' AND i.state='initialized'
   AND (lower(to_jsonb(i)->>'mode')='scrum' OR EXISTS (
     SELECT 1 FROM public.smn_team t WHERE t.installation_id=i.id
     AND lower(COALESCE(to_jsonb(t)->>'agile_mode',''))='scrum'
     AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
   )) LIMIT 1`);
  if(result.rows.length!==1)return [];
  const teams=await db.query<{id:string;name:string}>(`SELECT id,name FROM public.smn_team
   WHERE installation_id='singleton' AND lower(COALESCE(to_jsonb(smn_team)->>'agile_mode',''))='scrum'
   AND COALESCE((to_jsonb(smn_team)->>'is_archived')::boolean,false)=false ORDER BY name`);
  return teams.rows;
 }).catch(()=>[] as {id:string;name:string}[]);
 if(!scrumTeams.length)redirect("/app/admin/settings");

 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 return <SettingsPageShell title={t("settingsSprint.workingDaysTitle")}
  description={t("settingsSprint.workingDaysScope")}
  eyebrow={t("settingsCatalog.navigation.adminEyebrow")}>
  <SettingsTabs label={t("settingsSprint.workingDaysTitle")} sections={[
   {id:"slots",label:t("settingsCatalog.tabs.slots"),content:<WorkSlotsForm teams={scrumTeams}/>},
   {id:"lunch",label:t("settingsCatalog.tabs.lunch"),content:<LunchForm/>}
  ]}/>
 </SettingsPageShell>;
}
