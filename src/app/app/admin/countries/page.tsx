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
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4">
  <header className="mb-4">
   <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">
    ← {translate(locale,"navigation.entries.settings")}
   </Link>
   <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
    <div>
     <h1 className="h3 mb-2">{translate(locale,"countries.title")}</h1>
     <p className="text-muted mb-0">{translate(locale,"countries.intro")}</p>
    </div>
   </div>
  </header>
  <CountryAdmin canManage={canAccess(actor,"write",{type:"settings",exists:true,inScope:true})}/>
 </main>;
}
