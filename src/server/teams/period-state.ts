import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {assertActiveTeamResource} from "@/server/teams/resource-guard";
import {readDevelopmentCapacity} from "@/server/capacity/engine";

type TeamPeriodResult=Readonly<{teamId:string;mode:"scrum"|"kanban";
 started:number;finished:number;recovered:number}>;
type SprintRow={id:string;start_at:string;end_at:string;status:string;
 has_started:boolean;has_ended:boolean;opening_on_time:boolean};
type KanbanRow={id:string;start_on:string;end_on:string;status:string;today:string};
const tables={
 scrum:["smn_sprint","smn_sprint_transition","smn_sprint_capacity_trigger"],
 kanban:["smn_kanban_period","smn_kanban_period_transition","smn_kanban_capacity_opening"]
} as const;

/** Transitions automatiques au sein d'une équipe autorisée en v28.
 * Aucune DDL, aucune clôture métier, aucun recalcul d'un snapshot historique.
 * Le code ne doit pas être invoqué tant que le verrou global reste fermé.
 */
export async function reconcileAuthorizedTeamPeriods(db:Client,actor:TeamActor,
 requestedTeamId:string):Promise<TeamPeriodResult>{
 if(actor.role!=="admin")throw Error("team-access-forbidden");
 await db.query("BEGIN");
 try{
  const team=await resolveAdminTeam(db,actor,requestedTeamId);
  // Keep the team row locked until commit: concurrent archival cannot race
  // with the period state transitions.
  const owner=await db.query<{id:string}>(`
   SELECT id FROM public.smn_team WHERE id=$1 AND installation_id=(
    SELECT installation_id FROM public.smn_account WHERE id=$2
   ) AND ($3::boolean=false OR is_archived=false) FOR UPDATE`,
   [team.team_id,actor.accountId,true]);
  if(owner.rows.length!==1)throw Error("team-access-forbidden");
  const mode=team.mode as "scrum"|"kanban";
  const ready=await db.query<{name:string|null}>(`
   SELECT to_regclass('public.'||t.name)::text AS name
   FROM unnest($1::text[]) AS t(name)`,[[...tables[mode]]]);
  if(ready.rows.length!==tables[mode].length||ready.rows.some(r=>!r.name))
   throw Error("team-period-storage-not-ready");
  // Sérialise le traitement même si deux requêtes arrivent simultanément.
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",
   [team.team_id+":team-period-transition"]);
  let started=0,finished=0,recovered=0;
  if(mode==="scrum"){
   const rows=await db.query<SprintRow>(`
    SELECT s.id,s.status,s.start_at::text AS start_at,s.end_at::text AS end_at,
     (s.start_at<=now()) AS has_started,(s.end_at<=now()) AS has_ended,
     (s.start_at>now()-interval '15 minutes') AS opening_on_time
    FROM public.smn_sprint s
    JOIN public.smn_team t ON t.id=s.team_id
    WHERE s.team_id=$1 AND t.installation_id='singleton'
     AND s.deleted_at IS NULL AND s.auto_suspended=false
     AND s.status IN ('planned','active')
    ORDER BY s.start_at,s.id FOR UPDATE OF s`,[team.team_id]);
   for(const s of rows.rows){
    if(!s.has_started||!["planned","active"].includes(s.status))continue;
    await assertActiveTeamResource(db,actor,team.team_id,"sprint",s.id);
    if(s.status==="planned"){
     await db.query(`INSERT INTO public.smn_sprint_transition
      (id,sprint_id,transition,business_at,actor_id)
      VALUES($1,$2,'started',$3,$4)
      ON CONFLICT (sprint_id,transition) DO NOTHING`,
      [randomUUID(),s.id,s.start_at,actor.accountId]);
     // Un Sprint découvert après sa fin ne reçoit PAS une nouvelle photo J/H.
     // Le producteur historique dispose déjà de son propre état "indisponible".
     if(!s.has_ended&&s.opening_on_time){
      await db.query(`INSERT INTO public.smn_sprint_capacity_trigger
       (sprint_id,due_at) VALUES($1,$2)
       ON CONFLICT(sprint_id) DO NOTHING`,[s.id,s.start_at]);
     }else recovered++;
     started++;
    }
    if(s.has_ended){
     await db.query(`INSERT INTO public.smn_sprint_transition
      (id,sprint_id,transition,business_at,actor_id)
      VALUES($1,$2,'ended',$3,$4)
      ON CONFLICT (sprint_id,transition) DO NOTHING`,
      [randomUUID(),s.id,s.end_at,actor.accountId]);
     finished++;
    }
    await db.query(`UPDATE public.smn_sprint SET status=$2
     WHERE id=$1 AND team_id=$3`,[
      s.id,s.has_ended?"finished":"active",team.team_id]);
   }
  }else{
   const rows=await db.query<KanbanRow>(`
    SELECT p.id,p.status,p.start_on::text AS start_on,
     p.end_on::text AS end_on,
     (now() AT TIME ZONE p.time_zone)::date::text AS today
    FROM public.smn_kanban_period p
    JOIN public.smn_team t ON t.id=p.team_id
    WHERE p.team_id=$1 AND t.installation_id='singleton'
      AND p.deleted_at IS NULL AND p.status IN ('planned','active')
    ORDER BY p.start_on,p.id FOR UPDATE OF p`,[team.team_id]);
   for(const p of rows.rows){
    if(p.today<p.start_on)continue;
    await assertActiveTeamResource(db,actor,team.team_id,"kanban-period",p.id);
    if(p.status==="planned"){
     const late=p.today>p.start_on;
     // Une ouverture historique ne doit jamais inventer de J/H initial.
     const exists=await db.query<{period_id:string}>(`
      SELECT period_id FROM public.smn_kanban_capacity_opening
      WHERE period_id=$1 FOR UPDATE`,[p.id]);
     if(exists.rows.length>1)throw Error("team-opening-inconsistent");
     let initialJh:number|null=null;
     let provenance="historical-unavailable";
     if(!late&&!exists.rows.length){
      const manual=await db.query<{manual_jh:string|null}>(`
       SELECT manual_jh::text FROM public.smn_capacity_period_override
       WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date
       LIMIT 1`,[team.team_id,p.start_on,p.end_on]);
      if(manual.rows[0]?.manual_jh!=null){
       initialJh=Number(manual.rows[0].manual_jh);
       provenance="manual";
      }else{
       const report=await readDevelopmentCapacity(db,p.start_on,p.end_on,{
        externalTransaction:true,teamId:team.team_id
       });
       if(report.team.id!==team.team_id)throw Error("team-capacity-scope-mismatch");
       initialJh=report.totalJh;
       provenance=initialJh===null?"unavailable-at-opening":"calculated";
      }
     }
     await db.query(`INSERT INTO public.smn_kanban_period_transition
      (id,period_id,transition,business_on,provenance)
      VALUES($1,$2,'started',$3,$4)
      ON CONFLICT(period_id,transition) DO NOTHING`,[
       randomUUID(),p.id,p.start_on,late?"recovered":"on-time"
     ]);
     if(!exists.rows.length){
      await db.query(`INSERT INTO public.smn_kanban_capacity_opening
       (period_id,opened_on,provenance,initial_jh)
       VALUES($1,$2,$3,$4)
       ON CONFLICT(period_id) DO NOTHING`,[
        p.id,p.start_on,provenance,initialJh
      ]);
     }
     started++;
     if(late)recovered++;
    }
    if(p.today>p.end_on){
     await db.query(`INSERT INTO public.smn_kanban_period_transition
      (id,period_id,transition,business_on,provenance)
      VALUES($1,$2,'ended',$3,$4)
      ON CONFLICT(period_id,transition) DO NOTHING`,[
       randomUUID(),p.id,p.end_on,p.today>p.end_on?"recovered":"on-time"
     ]);
     finished++;
    }
    await db.query(`UPDATE public.smn_kanban_period SET status=$2
     WHERE id=$1 AND team_id=$3`,[
      p.id,p.today>p.end_on?"finished":"active",team.team_id]);
   }
  }
  await db.query("COMMIT");
  return {teamId:team.team_id,mode,started,finished,recovered};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
