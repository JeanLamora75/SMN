import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidDate} from "./assignment";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function correctAssignmentStart(db:Client,memberId:string,actorId:string,input:unknown,teamScope?:{actor:TeamActor;teamId:string}){
 if(!UUID.test(memberId)||!actorId||!input||typeof input!=="object"||Array.isArray(input))return {ok:false as const,error:"invalid-input"};
 const v=input as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="assignmentId,newStartOn,revision"||typeof v.assignmentId!=="string"||!UUID.test(v.assignmentId)||
 !isValidDate(v.newStartOn)||!Number.isSafeInteger(v.revision)||Number(v.revision)<0)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const m=await db.query<{revision:number}>(`SELECT revision FROM public.smn_member WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[memberId]);
  if(!m.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(m.rows[0].revision!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
  const rows=await db.query<{start_on:string;end_on:string|null;team_id:string}>(`SELECT a.start_on::text,a.end_on::text,a.team_id FROM public.smn_member_assignment a
  JOIN public.smn_team t ON t.id=a.team_id JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE a.id=$1 AND a.member_id=$2 AND i.id='singleton' AND i.state='initialized' FOR UPDATE`,[v.assignmentId,memberId]);
  const a=rows.rows[0];
  if(!a){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(teamScope){
   const selected=await resolveAdminTeam(db,teamScope.actor,teamScope.teamId);
   if(a.team_id!==selected.team_id){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  }
  if(v.newStartOn===a.start_on){await db.query("ROLLBACK");return {ok:false as const,error:"unchanged"};}
  const newStartOn=v.newStartOn as string;
  if(a.end_on!==null&&newStartOn>a.end_on){
   await db.query("ROLLBACK");return {ok:false as const,error:"after-end"};
  }
  // Check overlap with every other assignment, in both correction directions.
  const overlaps=await db.query(`SELECT id FROM public.smn_member_assignment WHERE member_id=$1 AND id<>$2
    AND start_on<=COALESCE($3::date,$4::date)
    AND (end_on IS NULL OR end_on>=$4::date) LIMIT 1`,
    [memberId,v.assignmentId,a.end_on,newStartOn]);
  if(overlaps.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"overlap"};}
  if(newStartOn>a.start_on){
   const absence=await db.query(`SELECT id FROM public.smn_member_absence a
    WHERE a.member_id=$1 AND a.start_on<$2::date AND a.end_on>=$3::date
     AND NOT EXISTS(SELECT 1 FROM public.smn_member_absence_history h
      WHERE h.absence_id=a.id AND h.revision=a.revision
       AND h.after_values->>'deleted'='true') LIMIT 1`,
    [memberId,newStartOn,a.start_on]);
   if(absence.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"historical-absences"};}
  }
  const first=await db.query<{id:string;effective_from:string}>(`SELECT id,effective_from::text FROM public.smn_member_assignment_version
    WHERE assignment_id=$1 ORDER BY effective_from ASC,revision ASC LIMIT 1 FOR UPDATE`,[v.assignmentId]);
  if(first.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"missing-version"};}
  if(newStartOn>a.start_on){
   const priorVersions=await db.query(`SELECT id FROM public.smn_member_assignment_version
    WHERE assignment_id=$1 AND id<>$2 AND effective_from<$3::date LIMIT 1`,
    [v.assignmentId,first.rows[0].id,newStartOn]);
   if(priorVersions.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"historical-versions"};}
  }
  const audit=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_member_assignment_start_audit') IS NOT NULL AS present`);
  if(!audit.rows[0]?.present)throw Error("member-audit-schema-not-ready: apply-member-deferred-v32");
  await db.query(`UPDATE public.smn_member_assignment SET start_on=$1::date WHERE id=$2 AND member_id=$3`,[v.newStartOn,v.assignmentId,memberId]);
  // Shift the first version with the corrected entry date; later versions remain unchanged.
  await db.query(`UPDATE public.smn_member_assignment_version SET effective_from=$1::date WHERE id=$2`,[newStartOn,first.rows[0].id]);
  await db.query(`UPDATE public.smn_member SET revision=revision+1,updated_at=now() WHERE id=$1`,[memberId]);
  await db.query(`INSERT INTO public.smn_member_assignment_start_audit(id,member_id,assignment_id,old_start_on,new_start_on,changed_by)
   VALUES($1,$2,$3,$4::date,$5::date,$6)`,[randomUUID(),memberId,v.assignmentId,a.start_on,v.newStartOn,actorId]);
  await db.query("COMMIT");
  return {ok:true as const,oldStartOn:a.start_on,newStartOn:v.newStartOn};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
