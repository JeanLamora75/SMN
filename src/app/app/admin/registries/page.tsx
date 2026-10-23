import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import RegistryList from "./registry-list";
import RegistryDeadlineAlerts from "./registry-deadlines";
import AttentionCockpit from "./attention-cockpit";
import AutomaticHighlightsSettings from "./automatic-highlights-settings";
import ConfirmedHighlights from "./confirmed-highlights";
import FactSelection from "./fact-selection";
export const dynamic="force-dynamic";
export default async function RegistriesPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const teamId=await withSprintIndexDb(async db=>{
  const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban') LIMIT 2`);
  return r.rows.length===1?r.rows[0].id:null;
 }).catch(()=>null);
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  {teamId?<><FactSelection canManage={actor.role==="admin"}/><ConfirmedHighlights canManage={actor.role==="admin"}/><AutomaticHighlightsSettings canManage={actor.role==="admin"}/><AttentionCockpit/><RegistryDeadlineAlerts canManage={actor.role==="admin"}/><RegistryList canManage={actor.role==="admin"}/></>:<p role="alert">Équipe indisponible / Team unavailable.</p>}
 </main>;
}
