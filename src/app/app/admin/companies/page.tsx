import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {canAccess} from "@/server/access-policy";
import CompaniesAdmin from "./companies-admin";
export const dynamic="force-dynamic";
export default async function CompaniesPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"write",{type:"companies",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 return <main className="smn-page container py-4">
  <header className="mb-4"><Link href="/app/admin/settings" className="btn btn-link px-0">{translate(locale,"settingsCatalog.navigation.back")}</Link>
   <h1>{translate(locale,"settingsCatalog.items.companies.title")}</h1><p>{translate(locale,"settingsCatalog.navigation.companiesIntro")}</p></header>
  <CompaniesAdmin/>
 </main>;
}