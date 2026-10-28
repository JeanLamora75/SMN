import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import CompanyClosuresAdmin from "./company-closures-admin";

export const dynamic="force-dynamic";
export default async function CompanyClosuresPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"write",{type:"settings",exists:true,inScope:true}))
  redirect("/app");
 const locale=await requestLocale();
 return <div className="smn-page container py-5">
  <header className="mb-4">
   <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {translate(locale,"navigation.entries.settings")}</Link>
   <h1 className="h3">{translate(locale,"companyClosures.title")}</h1>
   <p>{translate(locale,"companyClosures.intro")}</p>
   <Link href="/app/admin/companies" className="btn btn-outline-primary me-2">Gérer les entreprises</Link>
   <Link href="/app/team-calendar" className="btn btn-outline-secondary">
    {translate(locale,"companyClosures.openTeamCalendar")}</Link>
  </header>
  <CompanyClosuresAdmin/>
 </div>;
}
