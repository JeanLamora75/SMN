import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import DevelopmentCapacityView from "./development-capacity-view";

export const dynamic="force-dynamic";
export default async function CapacityPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"members",exists:true,inScope:true}))
  redirect("/app");
 const locale=await requestLocale();
 return <div className="smn-page container py-4">
  <div className="mb-3"><Link className="btn btn-outline-secondary" href="/app/team-calendar">
   {translate(locale,"developmentCapacity.back")}</Link></div>
  <DevelopmentCapacityView/>
 </div>;
}
