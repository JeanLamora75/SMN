import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import PasswordChangeForm from "./password-form";
import SessionActivity from "../app/session-activity";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic = "force-dynamic";
export default async function ChangePasswordPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (!account.must_change_password) redirect("/app");
  const locale=await requestLocale();
  return <main className="smn-page container py-5">
    <section className="smn-panel p-4 p-md-5 mx-auto" style={{maxWidth:640}}>
      <h1 className="h3">{translate(locale,"password.initialTitle")}</h1>
      <p>{translate(locale,"password.welcome",{username:account.username})}</p>
      <p className="small text-secondary">{translate(locale,"password.pilotInfo")}</p>
      <PasswordChangeForm/>
      <SessionActivity/>
    </section>
  </main>;
}
