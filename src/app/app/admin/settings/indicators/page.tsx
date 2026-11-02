import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import IndicatorCatalog from "../../indicators/catalog-client";
import TeamGrants from "../../indicators/team-grants";
import ExpressionGuide from "./expression-guide";
export const dynamic="force-dynamic";
export default async function IndicatorSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(account.role!=="admin")redirect("/app");
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  <header className="smn-panel rounded-4 px-4 py-3 mb-3">
   <h1 className="h4 mb-1">Paramètres · Indicateurs</h1>
   <p className="small text-secondary mb-0">Catalogue global des définitions d’indicateurs — administration</p>
  </header>
  <div className="smn-panel rounded-4 p-3 mb-3"><nav className="nav nav-pills gap-2" aria-label="Onglets des paramètres indicateurs"><a className="nav-link" href="#catalogue">Catalogue</a><a className="nav-link" href="#guide-expressions">Guide des expressions</a></nav></div>
  <section id="catalogue" aria-label="Catalogue des indicateurs"><IndicatorCatalog teams={[]} isAdmin scope="global"/></section>
  <section id="guide-expressions" className="mt-4"><ExpressionGuide/></section>
  <details className="smn-panel rounded-4 p-3 mt-4"><summary className="fw-semibold">Habilitations des Scrum Masters par équipe</summary><TeamGrants/></details>
 </main>;
}
