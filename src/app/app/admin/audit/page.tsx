import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readAuditJournal} from "@/server/audit/journal";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import AuditJournalView from "./audit-journal-view";
export const dynamic="force-dynamic";
export default async function AuditPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"audit",exists:true,inScope:true}))notFound();
 const locale=await requestLocale();
 const entries=await withAuthDb(client=>readAuditJournal(client)).catch(()=>null);
 return <div className="smn-page container py-5">
  <header className="mb-4">
   <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {translate(locale,"navigation.entries.settings")}</Link>
   <h1 className="h3">{t("audit.title")}</h1>
   <p>{t("audit.intro")}</p>
   <Link href="/app" className="btn btn-outline-secondary">{t("audit.back")}</Link>
  </header>
  <AuditJournalView entries={entries} locale={locale}/>
 </div>;
}
