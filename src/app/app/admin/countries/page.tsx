import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import CountryAdmin from "./country-admin";
export const dynamic="force-dynamic";
export default async function CountriesPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 return <div className="smn-page container py-5">
  <header className="mb-4">
   <h1 className="h3">{translate(locale,"countries.title")}</h1>
   <p>{translate(locale,"countries.intro")}</p>
   <Link href="/app" className="btn btn-outline-secondary">{translate(locale,"members.back")}</Link>
  </header>
  <CountryAdmin/>
 </div>;
}
