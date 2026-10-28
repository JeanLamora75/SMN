import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseActualChange} from "@/server/capacity/actual";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

type WriteError="invalid-input"|"future-period"|"protected"|"conflict"|
 "nothing-to-clear"|"team-unavailable";
export type TeamActualWriteResult=Readonly<
 {ok:true;teamId:string;revision:number}|
 {ok:false;error:WriteError}
>;

/** Saisie / effacement de la capacité réelle d'une seule équipe en v28.
 * Période et audit historiés dans la même transaction ; aucune clôture
 * ni recalcul de snapshot n'est réalisé par cette opération.
 * La route HTTP reste fermée par MULTI_TEAM_CONTEXT_READY=false.
 */
export async function saveTeamActualCapacity(db:Client,actor:TeamActor,
 teamId:string,raw:unknown):Promise<TeamActualWriteResult>{
 const value=parseActualChange(raw);
 if(!value||typeof teamId!=="string"||actor.role!=="admin")
  return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const fail=async(error:WriteError):Promise<TeamActualWriteResult>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const authorized=await resolveAdminTeam(db,actor,teamId);
  // Sérialise les premières créations d'une même équipe/période.
  const team=await db.query<{id:string}>(
   "SELECT t.id FROM public.smn_team t WHERE t.id=$1 "+
   "AND t.installation_id='singleton' AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false FOR UPDATE",[authorized.team_id]);
  if(team.rows.length!==1)return fail("team-unavailable");
  const clock=await db.query<{today:string}>(
   "SELECT (now() AT TIME ZONE 'Europe/Paris')::date::text AS today");
  const today=clock.rows[0]?.today;
  if(!today)throw Error("actual-clock-unavailable");
  if(value.start>today)return fail("future-period");

  const period=await db.query<{
   id:string;closed_at:string|null;frozen_at:string|null
  }>(`SELECT id,closed_at::text AS closed_at,frozen_at::text AS frozen_at
   FROM public.smn_capacity_period_override
   WHERE team_id=$1 AND start_on=$2::date AND end_on=$3::date
   FOR UPDATE`,[authorized.team_id,value.start,value.end]);
  if(period.rows.length>1)throw Error("actual-period-inconsistent");
  const current=period.rows[0];
  if(current?.closed_at||current?.frozen_at)return fail("protected");
  const old=current?await db.query<{id:string;manual_jh:number|null;revision:number}>(`
    SELECT id,manual_jh::float8 AS manual_jh,revision
    FROM public.smn_capacity_actual_override
    WHERE period_id=$1 FOR UPDATE`,[current.id]):{rows:[]};
  if(old.rows.length>1)throw Error("actual-override-inconsistent");
  const previous=old.rows[0];
  if((previous?.revision??0)!==value.revision)return fail("conflict");
  if(value.action==="clear"&&(!previous||previous.manual_jh===null))
   return fail("nothing-to-clear");

  const nextJh=value.action==="set"?value.manualJh!:null;
  const nextRevision=value.revision+1;
  let periodId=current?.id;
  if(!periodId){
   if(value.action!=="set")return fail("nothing-to-clear");
   periodId=randomUUID();
   await db.query(`INSERT INTO public.smn_capacity_period_override
    (id,team_id,start_on,end_on,manual_jh,revision)
    VALUES($1,$2,$3::date,$4::date,NULL,1)`,
    [periodId,authorized.team_id,value.start,value.end]);
  }
  const actualId=previous?.id??randomUUID();
  if(previous){
   const updated=await db.query(`
    UPDATE public.smn_capacity_actual_override
    SET manual_jh=$2,revision=revision+1,updated_by=$3,updated_at=now()
    WHERE id=$1 AND revision=$4`,
    [actualId,nextJh,actor.accountId,value.revision]);
   if(updated.rowCount!==1)return fail("conflict");
  }else{
   await db.query(`INSERT INTO public.smn_capacity_actual_override
    (id,period_id,manual_jh,revision,updated_by)
    VALUES($1,$2,$3,1,$4)`,[actualId,periodId,nextJh,actor.accountId]);
  }
  await db.query(`INSERT INTO public.smn_capacity_actual_override_history
   (id,actual_id,revision,operation,before_jh,after_jh,changed_by)
   VALUES($1,$2,$3,$4,$5,$6,$7)`,[
    randomUUID(),actualId,nextRevision,value.action,previous?.manual_jh??null,
    nextJh,actor.accountId
   ]);
  await db.query("COMMIT");
  return {ok:true,teamId:authorized.team_id,revision:nextRevision};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if((error as {code?:string})?.code==="23505")
   return {ok:false,error:"conflict"};
  throw error;
 }
}
