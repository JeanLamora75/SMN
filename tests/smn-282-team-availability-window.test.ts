import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {parseTeamAvailabilityWindow,readTeamAvailabilityWindow}
 from "../src/server/members/team-availability-window";

const memberId="123e4567-e89b-42d3-a456-426614174000";
const params={memberId,teamId:"team_b",startOn:"2026-10-01",endOn:"2026-10-31"};
type FakeOptions={assignment?:boolean;admin?:boolean};
function fake(options:FakeOptions={}){
 const calls:{sql:string;values:unknown[]}[]=[];
 const query=async(sql:string,values:unknown[]=[]):Promise<{rows:any[]}>=>{
  calls.push({sql,values});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:options.admin===false?[]:
    [{installation_id:"singleton",schema_version:28}]};
  if(sql.includes("SELECT t.id AS team_id FROM public.smn_account_team_preference"))
   return {rows:[{team_id:"team_a"}]};
  if(sql.includes("SELECT a.id FROM public.smn_member_assignment a"))
   return {rows:options.assignment===false?[]:[{id:"assignment_b"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:"team_b",
     team:"Panda",mode:"scrum"}]};
  if(sql.includes("WITH member_days AS"))
   return {rows:options.assignment===false?[]:[
    {day:"2026-10-01",morning_absent:true,afternoon_absent:false},
    {day:"2026-10-02",morning_absent:false,afternoon_absent:false}
   ]};
  throw Error("Unexpected SQL: "+sql);
 };
 return {db:{query} as unknown as Client,calls};
}
test("validation stricte : dates, UUID, teamId et fenêtre maximum de 31 jours",()=>{
 assert.deepEqual(parseTeamAvailabilityWindow(memberId,"team_b","2026-10-01","2026-10-31"),
  params);
 assert.equal(parseTeamAvailabilityWindow(memberId,"team_b","2026-10-01","2026-11-01"),null);
 assert.equal(parseTeamAvailabilityWindow(memberId,"team_b","2026-02-30","2026-03-02"),null);
 assert.equal(parseTeamAvailabilityWindow(memberId,"../../team","2026-10-01","2026-10-05"),null);
 assert.equal(parseTeamAvailabilityWindow("other","team_b","2026-10-01","2026-10-05"),null);
 assert.equal(parseTeamAvailabilityWindow(memberId,"team_b","2026-10-31","2026-10-01"),null);
});
test("le lien historique explicite prime sur la préférence et vérifie l'installation",async()=>{
 const {db,calls}=fake();
 const result=await readTeamAvailabilityWindow(db,{accountId:"admin",role:"admin"},params);
 assert.equal(result.teamId,"team_b");
 assert.equal(result.memberId,memberId);
 assert.deepEqual(result.days,[
  {date:"2026-10-01",morningAbsent:true,afternoonAbsent:false},
  {date:"2026-10-02",morningAbsent:false,afternoonAbsent:false}
 ]);
 const context=calls.find(x=>x.sql.includes("SELECT p.id AS product_id"));
 assert.deepEqual(context?.values,["team_b","singleton"]);
 const days=calls.find(x=>x.sql.includes("WITH member_days AS"));
 assert.deepEqual(days?.values,[memberId,"team_b","2026-10-01","2026-10-31"]);
});
test("requête limite à l'affectation équipe ET aux jours historiques concernés",async()=>{
 const {db,calls}=fake();
 await readTeamAvailabilityWindow(db,{accountId:"admin",role:"admin"},params);
 const sql=calls.find(x=>x.sql.includes("WITH member_days AS"))!.sql;
 assert.match(sql,/x.member_id=\$1 AND x.team_id=\$2/);
 const memberScope=calls.find(x=>x.sql.includes("SELECT a.id FROM public.smn_member_assignment a"));
 assert.match(memberScope!.sql,/m.installation_id=\x27singleton\x27/);
 assert.deepEqual(memberScope?.values,[memberId,"team_b"]);
 assert.match(sql,/x.start_on<=gs.day::date/);
 assert.match(sql,/x.end_on>=gs.day::date/);
 assert.match(sql,/a.start_on<=d.day AND a.end_on>=d.day/);
 assert.match(sql,/NOT EXISTS\(/);
 assert.doesNotMatch(sql,/a.reason|a.category_id|a.created_at/);
 assert.doesNotMatch(sql,/CREATE TABLE|ALTER TABLE|UPDATE public|INSERT INTO/i);
});
test("aucune affectation dans la fenêtre : aucune donnée individuelle divulguée",async()=>{
 const {db}=fake({assignment:false});
 await assert.rejects(()=>readTeamAvailabilityWindow(db,
  {accountId:"admin",role:"admin"},params),/member-out-of-team/);
});
test("compte user et payload non autorisé refusés avant lecture des absences",async()=>{
 const user=fake();
 await assert.rejects(()=>readTeamAvailabilityWindow(user.db,
  {accountId:"user",role:"user"},params),/team-access-forbidden/);
 assert.equal(user.calls.length,0);
 const malformed=fake();
 await assert.rejects(()=>readTeamAvailabilityWindow(malformed.db,
  {accountId:"admin",role:"admin"},{...params,installationId:"singleton"}),
  /team-availability-invalid-input/);
 assert.equal(malformed.calls.length,0);
});
