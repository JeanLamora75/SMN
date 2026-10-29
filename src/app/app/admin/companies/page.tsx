import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import CompaniesAdmin from "./companies-admin";
export const dynamic="force-dynamic";
export default async function CompaniesPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"write",{type:"companies",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container py-4">
  <header className="mb-4"><Link href="/app/admin/settings" className="btn btn-link px-0">← Paramètres</Link>
   <h1>Entreprises</h1><p>Référentiel partagé entre toutes les équipes.</p></header>
  <CompaniesAdmin/>
 </main>;
}