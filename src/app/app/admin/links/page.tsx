import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {withAuthDb} from "@/server/auth/database";
import {resolveAdminTeam} from "@/server/teams/resolve";
import LinksCockpit from "./links-cockpit";
import "./links-cockpit.css";
export const dynamic="force-dynamic";
export default async function LinksPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.role!=="admin")return <main className="container-fluid px-3 px-lg-4 py-4"><p role="alert">Accès non autorisé / Access denied.</p></main>;
 const context=await withAuthDb(db=>resolveAdminTeam(db,{accountId:actor.id,role:"admin"})).catch(()=>null);
 return <main className="smn-page container-fluid px-3 px-lg-4 py-4">
  {context?<LinksCockpit key={context.team_id} teamId={context.team_id} teamName={context.team}/>:<p role="alert">Équipe indisponible / Team unavailable.</p>}
 </main>;
}
