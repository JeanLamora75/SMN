import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import KanbanCadenceForm from "./kanban-cadence-form";
import KanbanCadenceProposal from "./cadence-proposal";
export const dynamic="force-dynamic";
export default async function KanbanCadencePage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 if(account.must_change_password)redirect("/change-password");
 return <main className="smn-page container py-4" style={{maxWidth:900}}>
  <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {translate(await requestLocale(),"navigation.entries.settings")}</Link>
  <KanbanCadenceForm/>
  {account.role==="admin"&&<KanbanCadenceProposal/>}
 </main>;
}
