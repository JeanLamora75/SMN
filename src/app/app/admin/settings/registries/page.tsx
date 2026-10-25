import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import AutomaticHighlightsSettings from "@/app/app/admin/registries/automatic-highlights-settings";
import RegistryDeadlineAlerts from "@/app/app/admin/registries/registry-deadlines";
export const dynamic="force-dynamic";
export default async function RegistrySettingsPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container-fluid px-3 px-lg-4 py-4">
  <Link href="/app/admin/settings">← Paramètres</Link>
  <header className="my-3"><h1 className="h3">Paramètres des registres</h1>
   <p className="text-secondary">Configurer les catégories du journal et le seuil des alertes d’échéance. Les registres métier ne sont pas modifiés.</p></header>
  <AutomaticHighlightsSettings canManage={actor.role==="admin"}/>
  <RegistryDeadlineAlerts canManage={actor.role==="admin"}/>
 </main>;
}
