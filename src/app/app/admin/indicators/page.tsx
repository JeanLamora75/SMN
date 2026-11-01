import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import IndicatorCatalog from "./catalog-client";
export const dynamic="force-dynamic";
export default async function IndicatorCatalogPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"write",{type:"settings",exists:true,inScope:true}))redirect("/app/admin/settings");
 const teams=await withAuthDb(async db=>{
  const r=await db.query<{id:string;name:string}>("SELECT id,name FROM public.smn_team WHERE installation_id='singleton' AND NOT is_archived ORDER BY name,id");
  return r.rows;
 });
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  <header className="mb-4"><h1 className="h3">Indicateurs dynamiques</h1><p className="text-secondary">Catalogue global, sélections par équipe et préférences d’affichage.</p></header>
  <IndicatorCatalog teams={teams}/>
 </main>;
}
