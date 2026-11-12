import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import SettingsPageShell from "../settings/settings-page-shell";
import KanbanCadenceForm from "./kanban-cadence-form";
import KanbanCadenceProposal from "./cadence-proposal";
export const dynamic="force-dynamic";
export default async function KanbanCadencePage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 if(account.must_change_password)redirect("/change-password");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"kanbanCadence.title")} description={translate(locale,"kanbanCadence.intro")} eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")} constrained>
  <KanbanCadenceForm/>
  {account.role==="admin"&&<KanbanCadenceProposal/>}
 </SettingsPageShell>;
}
