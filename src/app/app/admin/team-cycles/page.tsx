import {redirect} from "next/navigation";
import Link from "next/link";
import {currentAccount} from "@/server/auth/session";
import {withAuthDb} from "@/server/auth/database";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import TeamCycleCreateForm from "./team-cycle-create-form";
import TeamCycleList from "./team-cycle-list";
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
 if(!context||!["scrum","kanban"].includes(context.mode)){
  const choices=await withAuthDb(async db=>{
   const rows=await db.query<{id:string;name:string}>(`
    SELECT t.id,t.name FROM public.smn_team t
    JOIN public.smn_account a ON a.installation_id=t.installation_id
    WHERE a.id=$1 AND a.role='admin' AND a.is_active=true
      AND a.must_change_password=false
      AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
    ORDER BY lower(t.name),t.id LIMIT 100`,[actor.id]);
   return rows.rows;
  }).catch(()=>[]);
  return <main className="container py-4"><h1 className="h3">Cycles par équipe</h1>
   <p role="status" className="alert alert-warning">
    Sélectionnez une équipe pour consulter ses cycles. La création reste désactivée.
   </p>
   {choices.length===0?<p>Aucune équipe accessible.</p>:
    <ul className="list-group">{choices.map(team=><li className="list-group-item" key={team.id}>
     <Link href={"/app/admin/team-cycles?"+new URLSearchParams({teamId:team.id}).toString()}>
      {team.name}
     </Link>
    </li>)}</ul>}
  </main>;
 }
 return <main className="container py-4" style={{maxWidth:760}}>
  <h1 className="h3">Création d'un cycle — {context.teamName}</h1>
  <TeamCycleCreateForm teamId={context.teamId} mode={context.mode as "scrum"|"kanban"}
   cadenceRevision={context.revision}
   enabled={MULTI_TEAM_CONTEXT_READY&&process.env.SMN_MULTI_TEAM_WRITES_ENABLED==="true"}/>
  <TeamCycleList teamId={context.teamId} mode={context.mode as "scrum"|"kanban"}/>
 </main>;
}
