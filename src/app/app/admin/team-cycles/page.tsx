import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {withAuthDb} from "@/server/auth/database";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import TeamCycleCreateForm from "./team-cycle-create-form";
export const dynamic="force-dynamic";

export default async function TeamCyclesPage({searchParams}:{
 searchParams:Promise<{teamId?:string}>
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(actor.role!=="admin")redirect("/app");
 const {teamId}=await searchParams;
 const context=await withAuthDb(async db=>{
  const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},teamId);
  const cadence=team.mode==="scrum"?
   await db.query<{revision:number}>("SELECT revision FROM public.smn_scrum_cadence WHERE team_id=$1",[team.team_id]):
   await db.query<{revision:number}>("SELECT revision FROM public.smn_kanban_cadence WHERE team_id=$1",[team.team_id]);
  return {teamId:team.team_id,teamName:team.team,mode:team.mode,
   revision:cadence.rows[0]?.revision??0};
 }).catch(()=>null);
 if(!context||!["scrum","kanban"].includes(context.mode))
  return <main className="container py-4"><h1 className="h3">Création d'un cycle</h1>
   <p role="alert" className="alert alert-warning">Aucune équipe active et cadence valide n'est disponible.</p></main>;
 return <main className="container py-4" style={{maxWidth:760}}>
  <h1 className="h3">Création d'un cycle — {context.teamName}</h1>
  <TeamCycleCreateForm teamId={context.teamId} mode={context.mode as "scrum"|"kanban"}
   cadenceRevision={context.revision}
   enabled={MULTI_TEAM_CONTEXT_READY&&process.env.SMN_MULTI_TEAM_WRITES_ENABLED==="true"}/>
 </main>;
}
