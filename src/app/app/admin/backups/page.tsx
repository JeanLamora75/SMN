import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import BackupsAdmin from "./backups-admin";
export const dynamic="force-dynamic";
export default async function BackupsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"backups",exists:true,inScope:true}))notFound();
 const locale=await requestLocale();
 return <div className="smn-page container py-5" style={{maxWidth:880}}>
  <header className="mb-4">
   <h1 className="h3">{translate(locale,"backups.title")}</h1>
   <p>{translate(locale,"backups.intro")}</p>
   <Link href="/app" className="btn btn-outline-secondary">{translate(locale,"backups.back")}</Link>
  </header>
  <BackupsAdmin/>
 </div>;
}
