import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { canAccess } from "@/server/access-policy";
import UsersAdmin from "./users-admin";
import SettingsPageShell from "../settings/settings-page-shell";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";

export const dynamic = "force-dynamic";
export default async function UsersPage() {
  const account=await currentAccount();
  if (!account) redirect("/login");
  if (account.must_change_password) redirect("/change-password");
  if (!canAccess(account,"read",{type:"accounts",exists:true,inScope:true})) redirect("/app");
  const locale=await requestLocale();
  return <SettingsPageShell title={translate(locale,"accounts.title")} description={translate(locale,"accounts.intro")} eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
    <UsersAdmin selfId={account.id}/>
  </SettingsPageShell>;
}
