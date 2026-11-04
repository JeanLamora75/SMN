import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {correctHistoricalTeamAssignment} from "../src/server/members/team-assignment-historical-correction";
import {cancelLatestTeamAssignmentRevision,parseRevisionCancellation} from "../src/server/members/team-assignment-revision-cancel";
import {addDatedTeamRoleChange} from "../src/server/members/team-assignment-dated-change";
import {revisionImpactWindow,isCapacityNeutralCancellation,countAffectedClosedSprints} from "../src/server/members/assignment-revision-impact";
import {requireTeamMemberScope} from "../src/server/members/team-scope";

const member="123e4567-e89b-42d3-a456-426614174000";
const assignment="123e4567-e89b-42d3-a456-426614174111";
const team="team_koala";
const admin={accountId:"admin",role:"admin" as const};
const unauthorized={accountId:"user",role:"user" as const};
const base={memberId:member,teamId:team,effectiveFrom:"2026-02-20",
 contractPercent:100,allocationPercent:100,contributionPercent:100,
 shares:{scrumMaster:0,productOwner:100,developer:0},revision:2};
const version=(revision:number,effective_from:string,product_owner_percent:number)=>({
 id:"version"+revision,revision,effective_from,contract_percent:100,allocation_percent:100,
 contribution_percent:100,scrum_master_percent:0,product_owner_percent,
 developer_percent:100-product_owner_percent
});
type FixtureOptions={archived?:boolean;assignmentFound?:boolean;frozen?:boolean;rows?:ReturnType<typeof version>[];failedUpdate?:boolean};
function fixture(options:FixtureOptions={}){
 const queries:{sql:string;params:unknown[]}[]=[];
 const versions=options.rows??[version(2,"2026-02-20",100),version(1,"2026-01-06",0)];
 const query=async(sql:string,params:unknown[]=[])=>{
  queries.push({sql,params});
  if(["BEGIN","COMMIT","ROLLBACK"].includes(sql))return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_account_team_preference"))return {rows:[{team_id:team}]};
  if(sql.includes("SELECT p.id AS product_id"))return {rows:[{product_id:null,product:null,team_id:team,team:"Koala",mode:"scrum"}]};
  if(sql.includes("SELECT a.installation_id,i.schema_version"))return {rows:[{installation_id:"singleton",schema_version:33}]};
  if(sql.includes("SELECT archived_at::text AS archived_at"))return {rows:[{archived_at:options.archived?"2026-10-01":null}]};

  if(sql.includes("FROM public.smn_member_assignment_version"))return {rows:versions};
  if(sql.includes("FROM public.smn_member_assignment"))return {rows:options.assignmentFound===false?[]:[{id:assignment,start_on:"2026-01-06",end_on:"2026-06-30"}]};
  if(sql.includes("FROM public.smn_sprint s"))return {rows:[{count:options.frozen?"2":"0"}]};
  if(sql.includes("FROM public.smn_member_lifecycle_event")&&sql.includes("MAX("))return {rows:[{max_revision:null}]};
  if(sql.includes("INSERT INTO public.smn_member_lifecycle_event"))return {rows:[],rowCount:1};
  if(sql.includes("UPDATE public.smn_member_assignment_version"))return {rows:[],rowCount:options.failedUpdate?0:1};
  if(sql.includes("DELETE FROM public.smn_member_assignment_version"))return {rows:[],rowCount:1};
  if(sql.includes("INSERT INTO public.smn_member_assignment_version"))return {rows:[],rowCount:1};
  throw Error("unexpected SQL: "+sql);
 };
 return {db:{query} as unknown as Client,queries};
}
const wrote=(queries:ReturnType<typeof fixture>["queries"])=>queries.some(q=>
 /\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+|FROM\s+)?public\./i.test(q.sql));
const touchedFrozen=(queries:ReturnType<typeof fixture>["queries"])=>queries.some(q=>
 /\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+|FROM\s+)?public\.(?:smn_sprint_closure_snapshot|smn_report_pdf_archive|smn_capacity_initial_snapshot)/i.test(q.sql));

test("P1 membres: refus d'un acteur non-administrateur, sans transaction ni écriture",async()=>{
 const c=fixture(),d=fixture(),e=fixture();
 await assert.rejects(()=>correctHistoricalTeamAssignment(c.db,unauthorized,member,{...base,targetRevision:2}),/team-access-forbidden/);
 await assert.rejects(()=>cancelLatestTeamAssignmentRevision(d.db,unauthorized,member,{teamId:team,assignmentId:assignment,revision:2}),/team-access-forbidden/);
 await assert.rejects(()=>addDatedTeamRoleChange(e.db,unauthorized,member,{...base,revision:2}),/team-access-forbidden/);
 for(const f of [c,d,e]){assert.equal(f.queries.length,0);assert.equal(wrote(f.queries),false);}
});

test("P1 membres: identifiants invalides et annulation initiale rejetés sans requête",async()=>{
 const bad=fixture();
 for(const payload of [
  {teamId:team,assignmentId:assignment,revision:1},
  {teamId:"../outside",assignmentId:assignment,revision:2},
  {teamId:team,assignmentId:"bad-id",revision:2},
  {teamId:team,assignmentId:assignment,revision:2,secret:true},
 ]){assert.equal(parseRevisionCancellation(payload),null);}
 assert.deepEqual(await cancelLatestTeamAssignmentRevision(bad.db,admin,member,
  {teamId:team,assignmentId:assignment,revision:1}),{ok:false,error:"invalid-input"});
 assert.equal(bad.queries.length,0);
});

test("P1 membres: date de correction hors affectation refusée et transaction annulée",async()=>{
 const f=fixture({assignmentFound:false});
 assert.deepEqual(await correctHistoricalTeamAssignment(f.db,admin,member,{...base,targetRevision:2}),
  {ok:false,error:"outside-assignment"});
 assert.ok(f.queries.some(q=>q.sql==="ROLLBACK"));
 assert.ok(!f.queries.some(q=>q.sql==="COMMIT"));
 assert.equal(wrote(f.queries),false);
});

test("P1 membres: un membre archivé ne peut recevoir ni correction ni suppression de révision",async()=>{
 for(const action of ["correct","cancel"] as const){
  const f=fixture({archived:true});
  const result=action==="correct"?
   await correctHistoricalTeamAssignment(f.db,admin,member,{...base,targetRevision:2}):
   await cancelLatestTeamAssignmentRevision(f.db,admin,member,{teamId:team,assignmentId:assignment,revision:2});
  assert.deepEqual(result,{ok:false,error:"archived"});
  assert.equal(wrote(f.queries),false);
  assert.ok(f.queries.some(q=>q.sql==="ROLLBACK"));
 }
});

test("P1 membres: conflit sur l'UPDATE historique entraîne ROLLBACK et pas de COMMIT",async()=>{
 const f=fixture({failedUpdate:true});
 const result=await correctHistoricalTeamAssignment(f.db,admin,member,{
  ...base,targetRevision:2,shares:{scrumMaster:0,productOwner:50,developer:50}
 });
 assert.deepEqual(result,{ok:false,error:"conflict"});
 assert.ok(f.queries.some(q=>q.sql==="ROLLBACK"));
 assert.ok(!f.queries.some(q=>q.sql==="COMMIT"));
 assert.equal(touchedFrozen(f.queries),false);
});

test("P1 membres: correction rétroactive autorisée sur sprint clos, audit conservé et snapshots intacts",async()=>{
 const f=fixture({frozen:true});
 const result=await correctHistoricalTeamAssignment(f.db,admin,member,{
  ...base,targetRevision:2,shares:{scrumMaster:0,productOwner:50,developer:50}
 });
 assert.equal(result.ok,true);
 assert.equal(result.ok?result.affectedClosedSprints:0,2);
 const audit=f.queries.findIndex(q=>q.sql.includes("INSERT INTO public.smn_member_lifecycle_event"));
 const update=f.queries.findIndex(q=>q.sql.includes("UPDATE public.smn_member_assignment_version"));
 assert.ok(audit>=0&&update>audit);
 assert.ok(f.queries.some(q=>q.sql==="COMMIT"));
 assert.equal(touchedFrozen(f.queries),false);
});

test("P1 membres: annulation de révision à capacité identique n'invalide aucun sprint clos",async()=>{
 const f=fixture({frozen:true,rows:[version(2,"2026-01-06",0),version(1,"2026-01-06",0)]});
 const result=await cancelLatestTeamAssignmentRevision(f.db,admin,member,{
  teamId:team,assignmentId:assignment,revision:2
 });
 assert.equal(result.ok,true);
 assert.equal(result.ok?result.affectedClosedSprints:-1,0);
 assert.ok(!f.queries.some(q=>q.sql.includes("FROM public.smn_sprint s")));
 assert.equal(touchedFrozen(f.queries),false);
});

test("P1 membres: modification réelle signale l'impact, sans toucher aux archives",async()=>{
 const f=fixture({frozen:true});
 const result=await cancelLatestTeamAssignmentRevision(f.db,admin,member,{
  teamId:team,assignmentId:assignment,revision:2
 });
 assert.equal(result.ok,true);
 assert.equal(result.ok?result.affectedClosedSprints:0,2);
 assert.deepEqual(f.queries.find(q=>q.sql.includes("FROM public.smn_sprint s"))?.params,
  [team,"2026-02-20","2026-06-30"]);
 assert.equal(touchedFrozen(f.queries),false);
});

test("P1 membres: impact borné à la période et révision masquée ignorée",()=>{
 const dates=[{revision:1,effective_from:"2026-01-06"},{revision:2,effective_from:"2026-02-20"},
  {revision:3,effective_from:"2026-05-04"}];
 assert.deepEqual(revisionImpactWindow(dates,dates[1],"2026-03-01"),{start:"2026-02-20",end:"2026-03-01"});
 assert.deepEqual(revisionImpactWindow(dates,dates[1],null),{start:"2026-02-20",end:"2026-05-03"});
 assert.equal(revisionImpactWindow([dates[1],{...dates[1],revision:5}],dates[1],null),null);
 const a=version(1,"2026-01-06",0),b=version(2,"2026-02-20",100);
 assert.equal(isCapacityNeutralCancellation([a,b],b),false);
 assert.equal(isCapacityNeutralCancellation([a,{...b,product_owner_percent:0,developer_percent:100}],
  {...b,product_owner_percent:0,developer_percent:100}),true);
});

test("P1 isolation: membre hors équipe refusé, même avec un identifiant personnel connu",async()=>{
 const calls:{sql:string;params:unknown[]}[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  calls.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:33}]};
  if(sql.includes("FROM public.smn_account_team_preference"))
   return {rows:[{team_id:team}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:team,team:"Koala",mode:"scrum"}]};
  if(sql.includes("SELECT DISTINCT a.member_id FROM public.smn_member_assignment"))
   return {rows:[]};
  throw Error("unexpected query");
 }} as unknown as Client;
 await assert.rejects(()=>requireTeamMemberScope(db,admin,member,team),/member-out-of-team/);
 const scope=calls.find(q=>q.sql.includes("SELECT DISTINCT a.member_id FROM public.smn_member_assignment"));
 assert.ok(scope);
 assert.deepEqual(scope.params,[member,team,false]);
 assert.match(scope.sql,/a\.team_id=\$2/);
 assert.equal(wrote(calls),false);
});

test("P1 isolation: accès à l'historique d'un ancien membre exige une autorisation explicite",async()=>{
 const flags:boolean[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:33}]};
  if(sql.includes("FROM public.smn_account_team_preference"))
   return {rows:[{team_id:team}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:team,team:"Koala",mode:"scrum"}]};
  if(sql.includes("SELECT DISTINCT a.member_id FROM public.smn_member_assignment")){
   flags.push(params[2]===true);
   return {rows:params[2]===true?[{member_id:member}]:[]};
  }
  throw Error("unexpected query");
 }} as unknown as Client;
 await assert.rejects(()=>requireTeamMemberScope(db,admin,member,team),/member-out-of-team/);
 assert.deepEqual(await requireTeamMemberScope(db,admin,member,team,
  {allowHistoricalAssignment:true}),{teamId:team,memberId:member});
 assert.deepEqual(flags,[false,true]);
});

test("P1 capacités closes: requête bornée à l'équipe et à l'intervalle, jamais aux archives PDF",async()=>{
 const calls:{sql:string;params:unknown[]}[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  calls.push({sql,params});
  return {rows:[{count:"2"}]};
 }} as unknown as Client;
 assert.equal(await countAffectedClosedSprints(db,team,{start:"2026-02-20",end:"2026-05-03"}),2);
 assert.equal(await countAffectedClosedSprints(db,team,null),0);
 assert.equal(calls.length,1);
 assert.deepEqual(calls[0].params,[team,"2026-02-20","2026-05-03"]);
 assert.match(calls[0].sql,/s\.team_id=\$1/);
 assert.match(calls[0].sql,/s\.status='closed'/);
 assert.equal(touchedFrozen(calls),false);
});
