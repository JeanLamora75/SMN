import {randomUUID,createHash} from "node:crypto";
function fingerprint(changes:unknown){return createHash("sha256").update(JSON.stringify(changes)).digest("hex");}
import type {Client} from "pg";
import {ensureKanbanPeriodTables} from "./periods";
import {readKanbanCadence} from "./cadence";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {cadenceChangeProposal} from "./cadence-change";

export async function kanbanCadenceProposal(db:Client,actorId:string,requestedTeamId?:string|null){
 const team=await resolveAdminTeam(db,{accountId:actorId,role:"admin"},requestedTeamId);
 if(team.mode!=="kanban")throw Error("kanban-team-unavailable");
 const cadence=await readKanbanCadence(db,{accountId:actorId,role:"admin"},team.team_id);
 await ensureKanbanPeriodTables(db);
 const rows=await db.query<{id:string;name:string;start_on:string;end_on:string;status:string;time_zone:string;today:string}>(`SELECT p.id,p.name,p.start_on::text,p.end_on::text,p.status,p.time_zone,
 (now() AT TIME ZONE p.time_zone)::date::text AS today
 FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton'
 AND i.state='initialized' AND p.team_id=$1 AND p.deleted_at IS NULL`,[team.team_id]);
 const today=rows.rows[0]?.today??new Date().toISOString().slice(0,10);
 const proposal=cadenceChangeProposal(rows.rows.map(p=>({
 id:p.id,name:p.name,startOn:p.start_on,endOn:p.end_on,status:p.status,timeZone:p.time_zone
 })),cadence.frequency,today);
 return {cadenceRevision:cadence.revision,proposalToken:fingerprint(proposal.changes),...proposal};
}
export async function confirmKanbanCadenceProposal(db:Client,actorId:string,revision:unknown,proposalToken:unknown,requestedTeamId?:string|null){
 if(typeof proposalToken!=="string"||!/^[a-f0-9]{64}$/.test(proposalToken)||!Number.isSafeInteger(revision)||Number(revision)<1)return {ok:false as const,error:"invalid-input"};
 await ensureKanbanPeriodTables(db);
 await db.query("BEGIN");
 try{
  const team=await resolveAdminTeam(db,{accountId:actorId,role:"admin"},requestedTeamId);
  if(team.mode!=="kanban")throw Error("kanban-team-unavailable");
  const id=team.team_id;
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[id+":kanban-period"]);
  const cadence=await db.query<{revision:number;frequency:"monthly"|"weekly"|"biweekly"}>(`SELECT revision,frequency FROM public.smn_kanban_cadence WHERE team_id=$1 FOR UPDATE`,[id]);
  if(cadence.rows[0]?.revision!==revision){await db.query("ROLLBACK");return {ok:false as const,error:"stale-proposal"};}
  const rows=await db.query<{id:string;name:string;start_on:string;end_on:string;status:string;time_zone:string;today:string}>(`SELECT id,name,start_on::text,end_on::text,status,time_zone,
   (now() AT TIME ZONE time_zone)::date::text AS today
   FROM public.smn_kanban_period WHERE team_id=$1 AND deleted_at IS NULL FOR UPDATE`,[id]);
  const today=rows.rows[0]?.today??new Date().toISOString().slice(0,10);
  const proposal=cadenceChangeProposal(rows.rows.map(p=>({id:p.id,name:p.name,startOn:p.start_on,endOn:p.end_on,status:p.status,timeZone:p.time_zone})),cadence.rows[0].frequency,today);
  if(fingerprint(proposal.changes)!==proposalToken){await db.query("ROLLBACK");return {ok:false as const,error:"stale-proposal" as const};}
  if(!proposal.canConfirm){await db.query("ROLLBACK");return {ok:false as const,error:"conflict-or-empty",changes:proposal.changes};}
  for(const c of proposal.changes){
   await db.query(`UPDATE public.smn_kanban_period SET start_on=$2,end_on=$3 WHERE id=$1`,[c.id,c.proposed.startOn,c.proposed.endOn]);
   await db.query(`INSERT INTO public.smn_kanban_period_audit (id,period_id,action,details,actor_id)
   VALUES($1,$2,'cadence-rescheduled',$3::jsonb,$4)`,[randomUUID(),c.id,JSON.stringify({before:c.previous,after:c.proposed,cadenceRevision:revision}),actorId]);
  }
  await db.query("COMMIT");
  return {ok:true as const,count:proposal.changes.length};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
