import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureKanbanPeriodTables} from "./periods";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {readDevelopmentCapacity} from "@/server/capacity/engine";

export type KanbanPeriodState="planned"|"active"|"finished"|"closed";
export function calendarState(status:KanbanPeriodState,startOn:string,endOn:string,today:string):KanbanPeriodState{
 if(status==="closed")return "closed";
 if(today>endOn)return "finished";
 if(today>=startOn)return "active";
 return "planned";
}
export async function reconcileKanbanStates(db:Client){
 // Ne jamais exécuter la réconciliation monoéquipe ni sa DDL en v28.
 await assertLegacyTeamApi(db);
 await ensureKanbanPeriodTables(db);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_kanban_period_transition (
 id text PRIMARY KEY, period_id text NOT NULL REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 transition text NOT NULL CHECK(transition IN ('started','ended')),
 business_on date NOT NULL, processed_at timestamptz NOT NULL DEFAULT now(),
 provenance text NOT NULL CHECK(provenance IN ('on-time','recovered')),
 UNIQUE(period_id,transition)
 )`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_kanban_capacity_opening (
 period_id text PRIMARY KEY REFERENCES public.smn_kanban_period(id) ON DELETE RESTRICT,
 opened_on date NOT NULL, captured_at timestamptz NOT NULL DEFAULT now(),
 provenance text NOT NULL CHECK(provenance IN ('pending-capture','historical-unavailable')),
 initial_jh numeric(12,4),
 CHECK(provenance<>'historical-unavailable' OR initial_jh IS NULL)
 )`);
 await db.query(`DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint
 WHERE conname='smn_kanban_capacity_opening_provenance_v2_check'
 AND conrelid='public.smn_kanban_capacity_opening'::regclass) THEN
 ALTER TABLE public.smn_kanban_capacity_opening
 DROP CONSTRAINT IF EXISTS smn_kanban_capacity_opening_provenance_check;
 ALTER TABLE public.smn_kanban_capacity_opening
 ADD CONSTRAINT smn_kanban_capacity_opening_provenance_v2_check
 CHECK (provenance IN ('pending-capture','historical-unavailable','calculated','manual','unavailable-at-opening'));
 END IF;
 END; $$`);
 await db.query("BEGIN");
 try{
  const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'`);
  if(teams.rows.length!==1)throw Error("kanban-team-unavailable");
  const teamId=teams.rows[0].id;
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[teamId+":kanban-period"]);
  const periods=await db.query<{id:string;start_on:string;end_on:string;status:KanbanPeriodState;today:string}>(`SELECT
    id,start_on::text,end_on::text,status,(now() AT TIME ZONE time_zone)::date::text AS today
   FROM public.smn_kanban_period WHERE team_id=$1 AND deleted_at IS NULL
   AND status IN ('planned','active') FOR UPDATE`,[teamId]);
  let started=0,finished=0,recovered=0;
  for(const p of periods.rows){
   const desired=calendarState(p.status,p.start_on,p.end_on,p.today);
   if(desired===p.status)continue;
   const openingWasMissed=p.today>p.start_on;
   if(p.status==="planned"&&(desired==="active"||desired==="finished")){
    await db.query(`INSERT INTO public.smn_kanban_period_transition
     (id,period_id,transition,business_on,provenance) VALUES($1,$2,'started',$3,$4)
     ON CONFLICT(period_id,transition) DO NOTHING`,
     [randomUUID(),p.id,p.start_on,openingWasMissed?"recovered":"on-time"]);
    // Recovery never invents historical JH. Genuine opening captures the shared engine exactly once.
    let initialJh:number|null=null;
    let openingProvenance="historical-unavailable";
    if(!openingWasMissed){
     const actual=await readDevelopmentCapacity(db,p.start_on,p.end_on,{externalTransaction:true});
     if(actual.team.id!==teamId)throw Error("kanban-opening-team-mismatch");
     const manual=await db.query<{manual_jh:string|null}>(`SELECT manual_jh::text FROM public.smn_capacity_period_override WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date LIMIT 1`,[teamId,p.start_on,p.end_on]);
     const manuallySet=manual.rows[0]?.manual_jh;
     initialJh=manuallySet!=null?Number(manuallySet):actual.totalJh;
     openingProvenance=manuallySet!=null?"manual":initialJh===null?"unavailable-at-opening":"calculated";
    }
    await db.query(`INSERT INTO public.smn_kanban_capacity_opening
     (period_id,opened_on,provenance,initial_jh)
     VALUES($1,$2,$3,$4) ON CONFLICT(period_id) DO NOTHING`,
     [p.id,p.start_on,openingProvenance,initialJh]);
    started++;
    if(openingWasMissed)recovered++;
   }
   if(desired==="finished"){
    await db.query(`INSERT INTO public.smn_kanban_period_transition
     (id,period_id,transition,business_on,provenance) VALUES($1,$2,'ended',$3,$4)
     ON CONFLICT(period_id,transition) DO NOTHING`,
     [randomUUID(),p.id,p.end_on,p.today>p.end_on?"recovered":"on-time"]);
    finished++;
   }
   await db.query("UPDATE public.smn_kanban_period SET status=$2 WHERE id=$1",[p.id,desired]);
  }
  await db.query("COMMIT");
  return {started,finished,recovered};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
