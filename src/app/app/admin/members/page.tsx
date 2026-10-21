import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import QuickMembersAdmin from "./quick-members-admin";

export const dynamic="force-dynamic";
export default async function MembersAdminPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"members",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 return <div className="smn-page container py-5">
  <header className="mb-4">
   <h1 className="h3">{translate(locale,"members.title")}</h1>
   <p>{translate(locale,"members.intro")}</p>
   <Link href="/app" className="btn btn-outline-secondary">{translate(locale,"members.back")}</Link>
  </header>
  {canAccess(actor,"write",{type:"members",exists:true,inScope:true})&&
   <div className="mb-4">
    <Link href="/app/admin/absence-categories" className="btn btn-outline-primary">
     {translate(locale,"absenceCategories.open")}</Link>
   </div>}
  <div className="mb-4">
   <Link href="/app/team-calendar" className="btn btn-outline-primary">
    {translate(locale,"teamCalendar.open")}
   </Link>
  </div>
  <QuickMembersAdmin/>
 </div>;
}
