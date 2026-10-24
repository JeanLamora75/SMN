import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {listBriefTemplates} from "@/server/ai-briefs/templates";
import TemplateEditor from "./template-editor";
export const dynamic="force-dynamic";
export default async function BriefTemplatesPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const templates=await withAuthDb(listBriefTemplates).catch(()=>[]);
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href="/app">← Tableau de bord</Link>
  <section className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4">Administration des modèles de briefs IA</h1>
   <p className="text-secondary">Créez des modèles réutilisables. Leur désactivation ne modifie jamais les archives TXT.</p>
   <TemplateEditor original={templates}/>
  </section>
 </main>;
}
