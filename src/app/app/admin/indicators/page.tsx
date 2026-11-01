import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {indicatorTeams} from "@/server/indicators/team-access";
import {withAuthDb} from "@/server/auth/database";
import IndicatorCatalog from "./catalog-client";
import TeamGrants from "./team-grants";
export const dynamic="force-dynamic";
export default async function IndicatorCatalogPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 
 const teams=await withAuthDb(async db=>{
  return indicatorTeams(db,{accountId:actor.id,role:actor.role});
 });
 if(actor.role!=="admin"&&teams.length===0)redirect("/app");
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  <header className="mb-4"><h1 className="h3">Indicateurs dynamiques</h1><p className="text-secondary">Catalogue global, sélections par équipe et préférences d’affichage.</p></header>
  <IndicatorCatalog teams={teams} isAdmin={actor.role==="admin"}/>
  {actor.role==="admin"&&<TeamGrants/>}
 </main>;
}
