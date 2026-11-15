import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {listBriefTemplates} from "@/server/ai-briefs/templates";
import SettingsPageShell from "../../settings/settings-page-shell";
import TemplateEditor from "./template-editor";
import "./template-editor.css";

export const dynamic="force-dynamic";

export default async function BriefTemplatesPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const [templates,locale]=await Promise.all([withAuthDb(listBriefTemplates),requestLocale()]);
 return <SettingsPageShell
  eyebrow={translate(locale,"briefPromptEditor.eyebrow")}
  title={translate(locale,"briefPromptEditor.heading")}
  description={translate(locale,"briefPromptEditor.intro")}>
  <TemplateEditor original={templates}/>
 </SettingsPageShell>;
}
