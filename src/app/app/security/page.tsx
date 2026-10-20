import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import PasswordChangeForm from "@/app/change-password/password-form";
import SecurityForm from "./security-form";
import SessionActivity from "../session-activity";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic = "force-dynamic";
export default async function SecurityPage() {
  const account=await currentAccount();
  if(!account) redirect("/login");
  if(account.must_change_password) redirect("/change-password");
  const locale=await requestLocale();
  const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
  return <main className="container py-5" style={{maxWidth:740}}>
    <Link href="/app">{t("security.back")}</Link>
    <h1 className="h3 mt-4">{t("security.title")}</h1>
    <section className="smn-panel p-4 my-4">
      <h2 className="h5">{t("security.changePassword")}</h2>
      <p className="text-secondary small">{t("security.invalidate")}</p>
      <PasswordChangeForm/>
    </section>
    {account.role==="admin" && <section className="smn-panel p-4">
      <h2 className="h5">{t("security.recoveryTitle")}</h2>
      <p className="text-secondary small">{t("security.recoveryInfo")}</p>
      <SecurityForm/>
    </section>}
    <SessionActivity/>
  </main>;
}
