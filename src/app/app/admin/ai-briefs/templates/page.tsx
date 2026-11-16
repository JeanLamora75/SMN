import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {listBriefTemplates} from "@/server/ai-briefs/templates";
import TemplateEditor from "./template-editor";
import {requestLocale} from "@/i18n/locale.server";
import {aiBriefText} from "@/lib/ai-brief-messages";
export const dynamic="force-dynamic";
export default async function BriefTemplatesPage(){
 const locale=await requestLocale();
 const t=(key:Parameters<typeof aiBriefText>[1])=>aiBriefText(locale,key);
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const templates=await withAuthDb(listBriefTemplates).catch(()=>[]);
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href="/app">{locale==="en"?"← Dashboard":"← Tableau de bord"}</Link>
  <section className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4">{t("modelAdminTitle")}</h1>
   <p className="text-secondary">{t("modelAdminHelp")}</p>
   <TemplateEditor original={templates}/>
  </section>
 </main>;
}
