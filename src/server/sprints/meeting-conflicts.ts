import type {Client} from "pg";
import {ensureCeremonySchema} from "./ceremonies";

export type MeetingSlot={id:string;title:string;startAt:string;endAt:string;teamId:string;source:"ceremony"|"manual"};
export type MeetingWarning={kind:"overlap"|"closure";eventId:string;eventTitle:string;otherId?:string;otherTitle?:string;startAt:string;endAt:string;detail?:string};
export function meetingOverlap(a:Pick<MeetingSlot,"startAt"|"endAt">,b:Pick<MeetingSlot,"startAt"|"endAt">){
 return a.startAt<b.endAt&&b.startAt<a.endAt;
}
export function detectMeetingConflicts(slots:MeetingSlot[]):MeetingWarning[]{
 const warnings:MeetingWarning[]=[];
 for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
  const a=slots[i],b=slots[j];
  if(a.teamId!==b.teamId||a.id===b.id||!meetingOverlap(a,b))continue;
  warnings.push({kind:"overlap",eventId:a.id,eventTitle:a.title,otherId:b.id,otherTitle:b.title,
   startAt:a.startAt>b.startAt?a.startAt:b.startAt,endAt:a.endAt<b.endAt?a.endAt:b.endAt});
 }
 return warnings;
}
export async function readMeetingConflicts(db:Client){
 await ensureCeremonySchema(db);
 const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(team.rows.length!==1)throw Error("scrum-team-unavailable");
 const teamId=team.rows[0].id;
 const query=await db.query<{id:string;title:string;start_at:string;end_at:string}>(`SELECT c.id,(s.name||' — '||c.kind) AS title,
 seg.starts_at::text AS start_at,seg.ends_at::text AS end_at
 FROM public.smn_sprint_ceremony c
 JOIN public.smn_sprint s ON s.id=c.sprint_id
 JOIN public.smn_sprint_ceremony_segment seg ON seg.ceremony_id=c.id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL
 ORDER BY seg.starts_at,c.id`,[teamId]);
 const slots:MeetingSlot[]=query.rows.map(x=>({id:x.id,title:x.title,startAt:new Date(x.start_at).toISOString(),endAt:new Date(x.end_at).toISOString(),teamId,source:"ceremony"}));
 const warnings=detectMeetingConflicts(slots);
 const closure=await db.query<{id:string;name:string;start_on:string;end_on:string}>(`SELECT id,name,start_on::text,end_on::text FROM public.smn_company_closure
 WHERE team_id=$1 AND is_active=true`,[teamId]);
 const formatterCache=new Map<string,Intl.DateTimeFormat>();
 const localDay=(instant:string,zone:string)=>{
  if(!formatterCache.has(zone))formatterCache.set(zone,new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}));
  const parts=formatterCache.get(zone)!.formatToParts(new Date(instant));
  const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return `${o.year}-${o.month}-${o.day}`;
 };
 const zones=await db.query<{id:string;time_zone:string}>(`SELECT c.id,s.time_zone FROM public.smn_sprint_ceremony c
 JOIN public.smn_sprint s ON s.id=c.sprint_id WHERE s.team_id=$1 AND s.deleted_at IS NULL`,[teamId]);
 const zoneMap=new Map(zones.rows.map(x=>[x.id,x.time_zone]));
 for(const slot of slots){
  const zone=zoneMap.get(slot.id)??"Europe/Paris";
  const date=localDay(slot.startAt,zone);
  for(const day of closure.rows){
   if(date>=day.start_on&&date<=day.end_on)warnings.push({kind:"closure",eventId:slot.id,eventTitle:slot.title,startAt:slot.startAt,endAt:slot.endAt,detail:day.name});
  }
 }
 return {slots,warnings};
}
