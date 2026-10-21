import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import AbsenceCategoriesAdmin from "./absence-categories-admin";

export const dynamic="force-dynamic";
export default async function AbsenceCategoriesPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"write",{type:"members",exists:true,inScope:true}))
  redirect("/app");
 const locale=await requestLocale();
 return <div className="smn-page container py-5">
  <header className="mb-4">
   <h1 className="h3">{translate(locale,"absenceCategories.title")}</h1>
   <p>{translate(locale,"absenceCategories.intro")}</p>
   <Link href="/app/admin/members" className="btn btn-outline-secondary">
    {translate(locale,"absenceCategories.back")}</Link>
  </header>
  <AbsenceCategoriesAdmin/>
 </div>;
}
