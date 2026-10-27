import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {createTeamMeeting,parseTeamMeeting} from "../src/server/teams/meeting-create";

const admin={accountId:"admin",role:"admin"} as const;
const scrum={teamId:"panda",cycleId:"sprint_panda",kind:"scrum",
 name:"Atelier",startAt:"2026-10-28T09:00:00.000Z",duration:60};
const kanban={...scrum,kind:"kanban",cycleId:"period_panda"};
type Opt={mode?:"scrum"|"kanban";status?:string;team?:boolean;cycle?:boolean;
 tables?:boolean;startOn?:string;endOn?:string;timeZone?:string;failHistory?:boolean};
function fixture(opt:Opt={}){
 const calls:Array<{sql:string;params:unknown[]}>= [];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  calls.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:28}]};
  if(sql.includes("FROM public.smn_account_team_preference p"))
   return {rows:[{team_id:"other"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:opt.team===false?[]:[{
    product_id:null,product:null,team_id:"panda",team:"Panda",mode:opt.mode??"scrum"
   }]};
  if(sql.includes("to_regclass"))return {
   rows:opt.tables===false?[{name:null},{name:"exists"}]:
    [{name:"exists"},{name:"exists"}]};
  if(sql.includes("FROM public.smn_sprint s")&&sql.includes("FOR UPDATE OF s"))
   return {rows:opt.cycle===false?[]:[{
    id:"sprint_panda",status:opt.status??"active",
    start_at:"2026-10-27T08:00:00.000Z",
    end_at:"2026-11-03T19:00:00.000Z"
   }]};
  if(sql.includes("FROM public.smn_kanban_period p")&&sql.includes("FOR UPDATE OF p"))
   return {rows:opt.cycle===false?[]:[{
    id:"period_panda",status:opt.status??"active",
    start_on:opt.startOn??"2026-10-27",
    end_on:opt.endOn??"2026-10-31",time_zone:opt.timeZone??"Europe/Paris"
   }]};
  if(opt.failHistory&&(
    sql.includes("INSERT INTO public.smn_sprint_exceptional_meeting_history")||
    sql.includes("INSERT INTO public.smn_kanban_period_audit")))
   throw Error("history-failed");
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,calls};
}
test("parseur : liste des champs stricte et horodatage UTC canonique",()=>{
 assert.deepEqual(parseTeamMeeting(scrum),scrum);
 assert.deepEqual(parseTeamMeeting(kanban),kanban);
 assert.equal(parseTeamMeeting({...scrum,teamId:"../foreign"}),null);
 assert.equal(parseTeamMeeting({...scrum,duration:481}),null);
 assert.equal(parseTeamMeeting({...scrum,startAt:"2026-10-28 09:00"}),null);
 assert.equal(parseTeamMeeting({...scrum,name:"   "}),null);
 assert.equal(parseTeamMeeting({...scrum,createdBy:"someone"}),null);
});
test("Scrum : création et historique atomiques sur un sprint de l'équipe",async()=>{
 const f=fixture();
 const r=await createTeamMeeting(f.db,admin,scrum);
 assert.equal(r.ok,true);
 if(r.ok)assert.deepEqual({teamId:r.teamId,kind:r.kind},
  {teamId:"panda",kind:"scrum"});
 assert.equal(f.calls[0].sql,"BEGIN");
 assert.equal(f.calls.at(-1)?.sql,"COMMIT");
 const scope=f.calls.find(q=>q.sql.includes("FOR UPDATE OF s"));
 assert.deepEqual(scope?.params,["sprint_panda","panda"]);
 assert.match(scope!.sql,/s.team_id=\$2/);
 const insert=f.calls.find(q=>q.sql.includes("INSERT INTO public.smn_sprint_exceptional_meeting\n"));
 assert.ok(insert);
 assert.equal(insert.params[1],"sprint_panda");
 const audit=f.calls.find(q=>q.sql.includes("INSERT INTO public.smn_sprint_exceptional_meeting_history"));
 assert.ok(audit);
 assert.equal(audit.params[2],"admin");
 assert.match(String(audit.params[3]),/"teamId":"panda"/);
 assert.equal(f.calls.some(q=>/CREATE TABLE|ALTER TABLE/i.test(q.sql)),false);
});
test("Kanban : création liée à la bonne période et audit append-only",async()=>{
 const f=fixture({mode:"kanban"});
 const result=await createTeamMeeting(f.db,admin,kanban);
 assert.equal(result.ok,true);
 const scope=f.calls.find(q=>q.sql.includes("FOR UPDATE OF p"));
 assert.deepEqual(scope?.params,["period_panda","panda"]);
 assert.match(scope!.sql,/p.team_id=\$2/);
 const insert=f.calls.find(q=>q.sql.includes("INSERT INTO public.smn_kanban_meeting\n"));
 assert.equal(insert?.params[1],"period_panda");
 const audit=f.calls.find(q=>q.sql.includes("INSERT INTO public.smn_kanban_period_audit"));
 assert.equal(audit?.params[1],"period_panda");
 assert.equal(audit?.params[3],"admin");
 assert.equal(f.calls.at(-1)?.sql,"COMMIT");
});
test("mode étranger, cycle inexistant, clos ou hors période : rollback",async()=>{
 const scenarios=[
  {opt:{mode:"kanban" as const},input:scrum,error:"mode-mismatch"},
  {opt:{cycle:false},input:scrum,error:"not-found"},
  {opt:{status:"closed"},input:scrum,error:"closed-period"},
  {opt:{mode:"kanban" as const,status:"closed"},input:kanban,error:"closed-period"},
  {opt:{mode:"kanban" as const,endOn:"2026-10-27"},input:kanban,error:"outside-period"},
  {opt:{tables:false},input:scrum,error:"storage-unavailable"}
 ];
 for(const {opt,input,error} of scenarios){
  const f=fixture(opt);
  assert.deepEqual(await createTeamMeeting(f.db,admin,input),
   {ok:false,error});
  assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
  assert.equal(f.calls.some(q=>q.sql.includes("INSERT INTO public.smn_kanban_meeting")||
   q.sql.includes("INSERT INTO public.smn_sprint_exceptional_meeting\n")),false);
 }
});
test("historisation en échec : aucune création validée",async()=>{
 for(const input of [scrum,kanban]){
  const f=fixture({mode:input.kind as "scrum"|"kanban",failHistory:true});
  await assert.rejects(()=>createTeamMeeting(f.db,admin,input),/history-failed/);
  assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
  assert.equal(f.calls.some(q=>q.sql==="COMMIT"),false);
 }
});
test("compte user et entrée malformée refusés avant BEGIN",async()=>{
 const user=fixture();
 await assert.rejects(()=>createTeamMeeting(user.db,
  {accountId:"user",role:"user"},scrum),/team-access-forbidden/);
 assert.equal(user.calls.length,0);
 const invalid=fixture();
 assert.deepEqual(await createTeamMeeting(invalid.db,admin,
  {...scrum,duration:0}),{ok:false,error:"invalid-input"});
 assert.equal(invalid.calls.length,0);
});
