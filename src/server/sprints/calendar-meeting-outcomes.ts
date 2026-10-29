import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {validCalendarMeetingRef,readCalendarMeeting,type CalendarMeetingKind}
 from "@/server/sprints/calendar-meeting-detail";

import {registryStatuses} from "@/lib/registry-types";
import {recordConfirmedHighlight} from "@/server/registries/confirmed-highlights";

export type MeetingOutcomeType="decision"|"action"|"highlight";
export type MeetingOutcome=Readonly<{
 id:string;type:MeetingOutcomeType;title:string;description:string;
 occurredOn:string;createdAt:string
}>;
const choices=["decision","action","highlight"] as const;
const validType=(value:unknown):value is MeetingOutcomeType=>
 typeof value==="string"&&choices.some(item=>item===value);
export function parseMeetingOutcome(raw:unknown):{
 type:MeetingOutcomeType;text:string
}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).sort().join(",")!=="text,type"||!validType(o.type)||
  typeof o.text!=="string")return null;
 const text=o.text.trim();
 if(!text||text.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text))return null;
 return {type:o.type,text};
}
const nameFor=(text:string)=>{
 const first=(text.split(/\r?\n/u).find(x=>x.trim())??text).trim();
 return first.slice(0,240).trim();
};
export function meetingOutcomeDate(iso:string,timeZone:string){
 return new Intl.DateTimeFormat("sv-SE",{timeZone,year:"numeric",
  month:"2-digit",day:"2-digit"}).format(new Date(iso));
}
async function ensureOutcomeLink(db:Client){
 const check=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_calendar_meeting_outcome_link') IS NOT NULL AS present`);
 if(!check.rows[0]?.present)throw Error("meeting-outcome-schema-not-ready: apply-meeting-outcome-schema-v32");
}
/** GET is SELECT-only. The meeting and its team are rechecked by the caller's authenticated scope. */
export async function readMeetingOutcomes(db:Client,kind:string,id:string):Promise<MeetingOutcome[]|null>{
 if(!validCalendarMeetingRef(kind,id))return null;
 const meeting=await readCalendarMeeting(db,kind,id);
 if(!meeting)return null;
 const present=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_calendar_meeting_outcome_link') IS NOT NULL AS present");
 if(!present.rows[0]?.present)return [];
 const result=await db.query<{
  id:string;type:MeetingOutcomeType;title:string;description:string|null;
  occurred_on:string;created_at:string
 }>(`SELECT r.id,r.type,r.title,r.description,
   r.occurred_on::text,r.created_at::text
  FROM public.smn_calendar_meeting_outcome_link l
  JOIN public.smn_registry_item r ON r.id=l.registry_item_id
    AND r.team_id=l.team_id AND r.type IN ('decision','action','highlight')
  JOIN public.smn_sprint s ON s.id=l.sprint_id AND s.team_id=l.team_id
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE l.meeting_kind=$1 AND l.meeting_id=$2 AND l.sprint_id=$3
   AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
  ORDER BY l.created_at DESC,r.id DESC LIMIT 100`,[kind,id,meeting.sprintId]);
 return result.rows.map(x=>({
  id:x.id,type:x.type,title:x.title,description:x.description??"",
  occurredOn:x.occurred_on,createdAt:x.created_at
 }));
}
/** Atomically materializes a comment as a registry item and relates it to its source event. */
export async function createMeetingOutcome(
 db:Client,actorId:string,kind:string,id:string,raw:unknown
){
 const input=parseMeetingOutcome(raw);
 if(!actorId||!validCalendarMeetingRef(kind,id)||!input)
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const meeting=await readCalendarMeeting(db,kind,id);
  if(!meeting){
   await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};
  }
  const scoped=await db.query<{team_id:string;status:string}>(`
    SELECT s.team_id,s.status FROM public.smn_sprint s
    JOIN public.smn_team t ON t.id=s.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton'
      AND i.state='initialized' AND lower(i.mode)='scrum'
    FOR UPDATE OF s`,[meeting.sprintId]);
  const sprint=scoped.rows[0];
  if(!sprint){
   await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};
  }
  if(sprint.status==="closed"){
   await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};
  }
  const required=["smn_registry_item","smn_registry_item_audit","smn_calendar_meeting_outcome_link"];
  const available=await db.query<{name:string}>(`SELECT relname AS name FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND relname=ANY($1::text[])`,[required]);
  if(required.some(name=>!available.rows.some(row=>row.name===name)))throw Error("meeting-outcome-schema-not-ready: migrate registries and outcomes");
  await ensureOutcomeLink(db);
  const idNew=randomUUID();
  const title=nameFor(input.text);
  const status=registryStatuses[input.type][0];
  const occurredOn=meetingOutcomeDate(meeting.startAt,meeting.timeZone);
  const values={type:input.type,title,teamId:sprint.team_id,occurredOn,
   status,description:input.text,owner:null,dueOn:null,comment:null};
  await db.query(`INSERT INTO public.smn_registry_item
   (id,installation_id,team_id,type,title,occurred_on,status,description,
    owner_name,due_on,comment,created_by)
   VALUES($1,'singleton',$2,$3,$4,$5::date,$6,$7,NULL,NULL,NULL,$8)`,
   [idNew,sprint.team_id,input.type,title,occurredOn,status,input.text,actorId]);
  await db.query(`INSERT INTO public.smn_registry_item_audit
   (id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,1,NULL,$3::jsonb,$4)`,
   [randomUUID(),idNew,JSON.stringify(values),actorId]);
  await db.query(`INSERT INTO public.smn_calendar_meeting_outcome_link
    (registry_item_id,sprint_id,team_id,meeting_kind,meeting_id)
    VALUES($1,$2,$3,$4,$5)`,
    [idNew,meeting.sprintId,sprint.team_id,kind,id]);
  if(input.type==="decision"&&status==="active")
   await recordConfirmedHighlight(db,{category:"recordedDecision",
    sourceKind:"registry",sourceId:idNew,sourceRevision:1,title,actorId});
  await db.query("COMMIT");
  return {ok:true as const,id:idNew};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);throw error;
 }
}
