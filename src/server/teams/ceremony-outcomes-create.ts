import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "./resolve";
import {readCalendarMeeting} from "../sprints/calendar-meeting-detail";
import {parseMeetingOutcome,meetingOutcomeDate} from "../sprints/calendar-meeting-outcomes";
import {registryStatuses} from "@/lib/registry-types";

/** Crée un élément de Registre lié à une cérémonie, sans DDL à l'exécution. */
export async function createScopedCeremonyOutcome(db:Client,actor:TeamActor,
 raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return {ok:false as const,error:"invalid-input"};
 const p=raw as Record<string,unknown>;
 if(Object.keys(p).sort().join(",")!=="ceremonyId,teamId,text,type"||
  typeof p.teamId!=="string"||typeof p.ceremonyId!=="string")
  return {ok:false as const,error:"invalid-input"};
 const input=parseMeetingOutcome({type:p.type,text:p.text});
 if(!input)return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const reject=async(error:string)=>{await db.query("ROLLBACK");return {ok:false as const,error};};
  const team=await resolveAdminTeam(db,actor,p.teamId);
  if(team.mode!=="scrum")return reject("mode-mismatch");
  const sprint=await db.query<{status:string;id:string}>(`
   SELECT s.status,s.id FROM public.smn_sprint s
   JOIN public.smn_sprint_ceremony c ON c.sprint_id=s.id
   WHERE c.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
   FOR UPDATE OF s,c`,[p.ceremonyId,team.team_id]);
  if(sprint.rows.length!==1)return reject("not-found");
  const meeting=await readCalendarMeeting(db,"ceremony",p.ceremonyId,team.team_id);
  if(!meeting||meeting.sprintId!==sprint.rows[0].id)return reject("not-found");
  if(sprint.rows.length!==1)return reject("not-found");
  if(sprint.rows[0].status==="closed")return reject("closed-period");
  const required=["smn_registry_item","smn_registry_item_audit","smn_calendar_meeting_outcome_link"];
  const present=await db.query<{name:string}>(`
   SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname=ANY($1::text[]) AND c.relkind IN ('r','p')`,[required]);
  if(present.rows.length!==required.length)return reject("storage-unavailable");
  const id=randomUUID();
  const title=(input.text.split(/\r?\n/u).find(x=>x.trim())??input.text).trim().slice(0,240);
  const occurredOn=meetingOutcomeDate(meeting.startAt,meeting.timeZone);
  const status=registryStatuses[input.type][0];
  const snapshot={type:input.type,title,teamId:team.team_id,occurredOn,status,
   description:input.text,owner:null,dueOn:null,comment:null};
  await db.query(`INSERT INTO public.smn_registry_item
   (id,installation_id,team_id,type,title,occurred_on,status,description,
    owner_name,due_on,comment,created_by)
   VALUES($1,'singleton',$2,$3,$4,$5::date,$6,$7,NULL,NULL,NULL,$8)`,
   [id,team.team_id,input.type,title,occurredOn,status,input.text,actor.accountId]);
  await db.query(`INSERT INTO public.smn_registry_item_audit
   (id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,1,NULL,$3::jsonb,$4)`,
   [randomUUID(),id,JSON.stringify(snapshot),actor.accountId]);
  await db.query(`INSERT INTO public.smn_calendar_meeting_outcome_link
   (registry_item_id,sprint_id,team_id,meeting_kind,meeting_id)
   VALUES($1,$2,$3,'ceremony',$4)`,[id,meeting.sprintId,team.team_id,meeting.id]);
  await db.query("COMMIT");
  return {ok:true as const,id};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
