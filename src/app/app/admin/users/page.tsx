import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { canAccess } from "@/server/access-policy";
import UsersAdmin from "./users-admin";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";

export const dynamic = "force-dynamic";
export default async function UsersPage() {
  const account=await currentAccount();
  if (!account) redirect("/login");
  if (account.must_change_password) redirect("/change-password");
  if (!canAccess(account,"read",{type:"accounts",exists:true,inScope:true})) redirect("/app");
  const locale=await requestLocale();
  return <div className="smn-page container py-5">
    <header className="mb-4">
      <h1 className="h3">{translate(locale,"accounts.title")}</h1>
      <p>{translate(locale,"accounts.intro")}</p>
      <Link href="/app" className="btn btn-outline-secondary">{translate(locale,"accounts.back")}</Link>
    </header>
    <UsersAdmin selfId={account.id}/>
  </div>;
}
