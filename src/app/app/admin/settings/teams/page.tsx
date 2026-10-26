import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import TeamsSettings from "./teams-settings";

export const dynamic="force-dynamic";

/** Cette page demeure en lecture seule jusqu'à l'activation contrôlée v28. */
export default async function TeamsSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))
  redirect("/app");
 const locale=await requestLocale();
 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">
  <header className="mb-4">
   <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">
    ← {translate(locale,"teamSettings.back")}
   </Link>
   <h1 className="h3">{translate(locale,"teamSettings.title")}</h1>
   <p className="text-secondary">{translate(locale,"teamSettings.intro")}</p>
  </header>
  <TeamsSettings/>
 </main>;
}
