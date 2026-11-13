import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import AbsenceCategoriesAdmin from "./absence-categories-admin";
import AbsenceCategoryCreateButton from "./absence-category-create-button";
import "./absence-category-cockpit.css";
import SettingsPageShell from "../settings/settings-page-shell";

export const dynamic="force-dynamic";
export default async function AbsenceCategoriesPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"write",{type:"members",exists:true,inScope:true}))
  redirect("/app");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"absenceCategories.title")} description={translate(locale,"absenceCategories.intro")} eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")} action={<AbsenceCategoryCreateButton/>}>
  <AbsenceCategoriesAdmin/>
 </SettingsPageShell>;
}
