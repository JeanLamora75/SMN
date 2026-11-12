import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import PasswordChangeForm from "@/app/change-password/password-form";
import SecurityForm from "./security-form";
import SettingsPageShell from "../admin/settings/settings-page-shell";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic = "force-dynamic";
export default async function SecurityPage() {
  const account=await currentAccount();
  if(!account) redirect("/login");
  if(account.must_change_password) redirect("/change-password");
  const locale=await requestLocale();
  const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
  return <SettingsPageShell title={t("security.title")} description={t("security.invalidate")} eyebrow={t("navigation.entries.settings")}>
    <section className="smn-panel rounded-4 p-4 mb-3">
      <h2 className="h5">{t("security.changePassword")}</h2>
      <p className="text-secondary small">{t("security.invalidate")}</p>
      <PasswordChangeForm/>
    </section>
    {account.role==="admin"&&<section className="smn-panel rounded-4 p-4">
      <h2 className="h5">{t("security.recoveryTitle")}</h2>
      <p className="text-secondary small">{t("security.recoveryInfo")}</p>
      <SecurityForm/>
    </section>}
  </SettingsPageShell>;
}
