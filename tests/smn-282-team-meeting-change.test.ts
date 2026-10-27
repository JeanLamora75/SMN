import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {changeTeamMeeting,parseTeamMeetingChange} from "../src/server/teams/meeting-change";

const admin={accountId:"admin",role:"admin"} as const;
const scrum={teamId:"panda",kind:"scrum",meetingId:"meeting_panda",
 action:"reschedule",expectedStartAt:"2026-10-28T09:00:00.000Z",
 expectedEndAt:"2026-10-28T10:00:00.000Z",
 startAt:"2026-10-28T10:00:00.000Z",endAt:"2026-10-28T11:00:00.000Z"};
const kanban={...scrum,kind:"kanban"};
type Opt={mode?:"scrum"|"kanban";row?:boolean;status?:string;cycleStatus?:string;
 change?:boolean;historyFails?:boolean;timeZone?:string;cycleEnd?:string};
function fixture(opt:Opt={}){
 const statements:{sql:string;params:unknown[]}[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  statements.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))return {
   rows:[{installation_id:"singleton",schema_version:28}]};
  if(sql.includes("FROM public.smn_account_team_preference p"))
   return {rows:[{team_id:"other"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:"panda",
    team:"Panda",mode:opt.mode??"scrum"}]};
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  if(sql.includes("AS cycle_status"))return {rows:opt.row===false?[]:[{
   id:"meeting_panda",cycle_id:"cycle_panda",status:opt.status??"scheduled",
   starts_at:"2026-10-28 09:00:00+00",
   ends_at:"2026-10-28 10:00:00+00",
   cycle_status:opt.cycleStatus??"active",
   cycle_start:"2026-10-27",cycle_end:opt.cycleEnd??"2026-10-31",
   time_zone:opt.timeZone??"Europe/Paris"
  }]};
  if(sql.includes("INSERT INTO public.smn_sprint_exceptional_meeting_history")||
     sql.includes("INSERT INTO public.smn_kanban_period_audit")){
   if(opt.historyFails)throw Error("audit-down");
   return {rows:[],rowCount:1};
  }
  if(sql.includes("UPDATE public.smn_kanban_meeting")||
     sql.includes("UPDATE public.smn_sprint_exceptional_meeting"))
   return {rows:[{id:"meeting_panda"}],rowCount:opt.change===false?0:1};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,statements};
}
test("parseur : CAS demandé, dates canoniques et pas de champs inconnus",()=>{
 assert.deepEqual(parseTeamMeetingChange(scrum),scrum);
 assert.equal(parseTeamMeetingChange({...scrum,expectedStartAt:"yesterday"}),null);
 assert.equal(parseTeamMeetingChange({...scrum,endAt:"2026-10-28T10:00:30.000Z"}),null);
 assert.equal(parseTeamMeetingChange({...scrum,teamId:"../../other"}),null);
 assert.equal(parseTeamMeetingChange({...scrum,extra:true}),null);
 assert.deepEqual(parseTeamMeetingChange({
  teamId:"panda",kind:"kanban",meetingId:"meeting_panda",action:"cancel",
  expectedStartAt:scrum.expectedStartAt,expectedEndAt:scrum.expectedEndAt
 }),{
  teamId:"panda",kind:"kanban",meetingId:"meeting_panda",action:"cancel",
  expectedStartAt:scrum.expectedStartAt,expectedEndAt:scrum.expectedEndAt
 });
});
test("Scrum exceptionnel : replanification transactionnelle et audit",async()=>{
 const f=fixture();
 const result=await changeTeamMeeting(f.db,admin,scrum);
 assert.deepEqual(result,{ok:true,changed:true,teamId:"panda",meetingId:"meeting_panda"});
 assert.equal(f.statements[0].sql,"BEGIN");
 assert.equal(f.statements.at(-1)?.sql,"COMMIT");
 const lock=f.statements.find(s=>s.sql.includes("FOR UPDATE OF m,c"));
 assert.deepEqual(lock?.params,["meeting_panda","panda"]);
 assert.match(lock!.sql,/c.team_id=\$2/);
 const update=f.statements.find(s=>s.sql.includes("UPDATE public.smn_sprint_exceptional_meeting"));
 assert.deepEqual(update?.params,["meeting_panda",scrum.startAt,scrum.endAt,
  "scheduled",60,scrum.expectedStartAt,scrum.expectedEndAt]);
 const audit=f.statements.find(s=>s.sql.includes("INSERT INTO public.smn_sprint_exceptional_meeting_history"));
 assert.ok(audit);
 assert.equal(audit.params[2],"rescheduled");
});
test("Kanban : annulation logique avec audit de période et sans DELETE",async()=>{
 const f=fixture({mode:"kanban"});
 const input={teamId:"panda",kind:"kanban",meetingId:"meeting_panda",
  action:"cancel",expectedStartAt:scrum.expectedStartAt,
  expectedEndAt:scrum.expectedEndAt};
 const result=await changeTeamMeeting(f.db,admin,input);
 assert.equal(result.ok,true);
 const update=f.statements.find(s=>s.sql.includes("UPDATE public.smn_kanban_meeting"));
 assert.equal(update?.params[3],"cancelled");
 const audit=f.statements.find(s=>s.sql.includes("INSERT INTO public.smn_kanban_period_audit"));
 assert.equal(audit?.params[1],"cycle_panda");
 assert.equal(audit?.params[2],"meeting-cancelled");
 assert.equal(audit?.params[4],"admin");
 assert.equal(f.statements.some(s=>/DELETE FROM public\.smn_(sprint_exceptional|kanban_meeting)/.test(s.sql)),false);
});
test("réunion autre équipe, période close, réunion déjà annulée : refus",async()=>{
 for(const [opt,error] of [
  [{row:false},"not-found"],
  [{cycleStatus:"closed"},"closed-period"],
  [{status:"cancelled"},"protected"]
 ] as const){
  const f=fixture(opt);
  assert.deepEqual(await changeTeamMeeting(f.db,admin,scrum),
   {ok:false,error});
  assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
  assert.equal(f.statements.some(s=>s.sql.includes("UPDATE public.")),false);
 }
});
test("horaires périmés et période dépassée : rollback",async()=>{
 const stale=fixture();
 assert.deepEqual(await changeTeamMeeting(stale.db,admin,{
  ...scrum,expectedStartAt:"2026-10-28T09:30:00.000Z"
 }),{ok:false,error:"conflict"});
 const outside=fixture({mode:"kanban",cycleEnd:"2026-10-27"});
 assert.deepEqual(await changeTeamMeeting(outside.db,admin,kanban),
  {ok:false,error:"outside-period"});
 assert.equal(outside.statements.at(-1)?.sql,"ROLLBACK");
});
test("échec CAS et erreur d'audit : aucune validation",async()=>{
 const cas=fixture({change:false});
 assert.deepEqual(await changeTeamMeeting(cas.db,admin,scrum),
  {ok:false,error:"conflict"});
 assert.equal(cas.statements.at(-1)?.sql,"ROLLBACK");
 const fail=fixture({historyFails:true});
 await assert.rejects(()=>changeTeamMeeting(fail.db,admin,scrum),/audit-down/);
 assert.equal(fail.statements.at(-1)?.sql,"ROLLBACK");
 assert.ok(!fail.statements.some(s=>s.sql==="COMMIT"));
});
test("compte user : rejet avant la transaction",async()=>{
 const f=fixture();
 await assert.rejects(()=>changeTeamMeeting(f.db,
  {accountId:"user",role:"user"},scrum),/team-access-forbidden/);
 assert.equal(f.statements.length,0);
});
