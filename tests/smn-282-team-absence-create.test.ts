import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {saveMemberAbsence} from "../src/server/members/absence";

const memberId="123e4567-e89b-42d3-a456-426614174000";
const absenceId="123e4567-e89b-42d3-a456-426614174111";
const person={accountId:"admin",role:"admin"} as const;
const scope={actor:person,teamId:"team_a"};
const creation={
 action:"create",revision:0,categoryId:"vacation",
 startOn:"2026-10-28",endOn:"2026-10-29",
 startSlot:"morning",endSlot:"afternoon",isPlanned:true,reason:"Congé"
};
type Assignment={team_id:string;start_on:string;end_on:string|null};
type Options={
 assignments?:Assignment[];oldStart?:string;oldEnd?:string;oldRevision?:number;
 overlaps?:boolean;archived?:boolean;failAudit?:boolean;
};
function fixture(options:Options={}){
 const statements:{sql:string;params:unknown[]}[]=[];
 const assignments=options.assignments??[{team_id:"team_a",start_on:"2026-10-01",end_on:null}];
 const query=async(sql:string,params:unknown[]=[])=>{
  statements.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:28}],rowCount:1};
  if(sql.includes("SELECT t.id AS team_id FROM public.smn_account_team_preference"))
   return {rows:[{team_id:"team_a"}],rowCount:1};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{team_id:"team_a",team:"Alpha",mode:"scrum",product_id:null,product:null}],rowCount:1};
  if(sql.includes("m.archived_at::text AS archived_at"))
   return {rows:[{id:memberId,archived_at:options.archived?"2026-10-10":null}],rowCount:1};
  if(sql.includes("FROM public.smn_member_assignment a")&&sql.includes("FOR SHARE OF a"))
   return {rows:assignments,rowCount:assignments.length};
  if(sql.includes("SELECT id,name,color,is_active FROM public.smn_absence_category"))
   return {rows:[{id:"vacation",name:"Congé",color:"secondary",is_active:true}],rowCount:1};
  if(sql.includes("FROM public.smn_member_absence a JOIN")&&sql.includes("FOR UPDATE OF a"))
   return {rows:[{
    id:absenceId,member_id:memberId,category_id:"vacation",
    category_name:"Congé",category_color:"secondary",
    revision:options.oldRevision??1,
    start_on:options.oldStart??"2026-10-27",
    end_on:options.oldEnd??"2026-10-28",
    start_slot:"morning",end_slot:"afternoon",
    is_planned:true,reason:"Congé",deleted:false
   }],rowCount:1};
  if(sql.includes("FROM public.smn_member_absence a WHERE a.member_id=$1"))
   return {rows:options.overlaps?[{id:"other",start_on:"2026-10-28",
    end_on:"2026-10-29",start_slot:"morning",end_slot:"afternoon"}]:[],rowCount:0};
  if(sql.includes("INSERT INTO public.smn_member_absence_history")&&options.failAudit)
   throw Error("write-audit-failed");
  return {rows:[],rowCount:1};
 };
 return {db:{query} as unknown as Client,statements};
}
test("création exclusivement dans l'équipe : absence et audit atomiques",async()=>{
 const {db,statements}=fixture();
 const result=await saveMemberAbsence(db,memberId,"admin",creation,scope);
 assert.equal(result.ok,true);
 assert.equal(statements[0].sql,"BEGIN");
 assert.equal(statements.at(-1)?.sql,"COMMIT");
 assert.equal(statements.filter(q=>q.sql.includes("INSERT INTO public.smn_member_absence\n")).length,1);
 assert.equal(statements.filter(q=>q.sql.includes("INSERT INTO public.smn_member_absence_history")).length,1);
 const lock=statements.find(q=>q.sql.includes("FOR SHARE OF a"));
 assert.deepEqual(lock?.params,[memberId,creation.startOn,creation.endOn]);
});
test("affectation d'une autre équipe recouvrante : création interdite",async()=>{
 const f=fixture({assignments:[
  {team_id:"team_a",start_on:"2026-10-01",end_on:null},
  {team_id:"team_b",start_on:"2026-10-28",end_on:"2026-10-28"}
 ]});
 assert.deepEqual(await saveMemberAbsence(f.db,memberId,"admin",creation,scope),
  {ok:false,error:"team-unavailable"});
 assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
 assert.equal(f.statements.some(q=>q.sql.includes("INSERT INTO public.smn_member_absence")),false);
});
test("affectation partielle, même équipe : fenêtre non couverte refusée",async()=>{
 const f=fixture({assignments:[
  {team_id:"team_a",start_on:"2026-10-28",end_on:"2026-10-28"}
 ]});
 assert.deepEqual(await saveMemberAbsence(f.db,memberId,"admin",creation,scope),
  {ok:false,error:"team-unavailable"});
 assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
});
test("pas de création si les créneaux se chevauchent sur la même personne",async()=>{
 const f=fixture({overlaps:true});
 assert.deepEqual(await saveMemberAbsence(f.db,memberId,"admin",creation,scope),
  {ok:false,error:"overlap"});
 assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
});
test("une erreur d'historisation annule la création et l'audit",async()=>{
 const f=fixture({failAudit:true});
 await assert.rejects(()=>saveMemberAbsence(f.db,memberId,"admin",creation,scope),
  /write-audit-failed/);
 assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
 assert.equal(f.statements.some(q=>q.sql==="COMMIT"),false);
});

const update={...creation,action:"update",id:absenceId,revision:1};
const remove={action:"delete",id:absenceId,revision:1};
test("modification dans l'équipe : ancienne ET nouvelle plages vérifiées",async()=>{
 const f=fixture();
 const result=await saveMemberAbsence(f.db,memberId,"admin",update,scope);
 assert.equal(result.ok,true);
 assert.equal(f.statements.filter(q=>q.sql.includes("FOR SHARE OF a")).length,2);
 assert.equal(f.statements.filter(q=>q.sql.includes("UPDATE public.smn_member_absence SET")).length,1);
 assert.equal(f.statements.at(-1)?.sql,"COMMIT");
});
test("modification refusée si l'ancienne période relevait d'une autre équipe",async()=>{
 const f=fixture({oldStart:"2026-09-30",oldEnd:"2026-10-01"});
 assert.deepEqual(await saveMemberAbsence(f.db,memberId,"admin",update,scope),
  {ok:false,error:"team-unavailable"});
 assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
 assert.equal(f.statements.some(q=>q.sql.startsWith("UPDATE public.smn_member_absence")),false);
});
test("modification refusée si la nouvelle période dépasse l'affectation",async()=>{
 const f=fixture({assignments:[
  {team_id:"team_a",start_on:"2026-10-01",end_on:"2026-10-28"}
 ]});
 assert.deepEqual(await saveMemberAbsence(f.db,memberId,"admin",
  {...update,endOn:"2026-10-29"},scope),
  {ok:false,error:"team-unavailable"});
 assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
});
test("suppression logique : audit tombstone sans DELETE destructif",async()=>{
 const f=fixture();
 const result=await saveMemberAbsence(f.db,memberId,"admin",remove,scope);
 assert.equal(result.ok,true);
 if(result.ok)assert.equal(result.deleted,true);
 const hist=f.statements.find(q=>q.sql.includes("INSERT INTO public.smn_member_absence_history"));
 assert.ok(hist);
 assert.match(String(hist.params[4]),/"deleted":true/);
 assert.ok(f.statements.some(q=>q.sql.includes("FOR SHARE OF a")));
 assert.equal(f.statements.some(q=>q.sql.startsWith("DELETE FROM public.smn_member_absence")),false);
 assert.equal(f.statements.at(-1)?.sql,"COMMIT");
});
test("suppression refusée sur une période hors équipe",async()=>{
 const f=fixture({oldStart:"2026-09-29",oldEnd:"2026-09-30"});
 assert.deepEqual(await saveMemberAbsence(f.db,memberId,"admin",remove,scope),
  {ok:false,error:"team-unavailable"});
 assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
});
test("conflit de révision et membre archivé : aucune mutation",async()=>{
 const stale=fixture({oldRevision:2});
 assert.deepEqual(await saveMemberAbsence(stale.db,memberId,"admin",update,scope),
  {ok:false,error:"conflict"});
 const archived=fixture({archived:true});
 assert.deepEqual(await saveMemberAbsence(archived.db,memberId,"admin",creation,scope),
  {ok:false,error:"archived"});
 for(const f of [stale,archived]){
  assert.equal(f.statements.at(-1)?.sql,"ROLLBACK");
  assert.ok(!f.statements.some(q=>q.sql.startsWith("UPDATE public.smn_member_absence")));
 }
});
test("acteur user ou identité différente : rollback et aucun audit",async()=>{
 const forbidden=fixture();
 await assert.rejects(()=>saveMemberAbsence(forbidden.db,memberId,"user",
  creation,{actor:{accountId:"user",role:"user"},teamId:"team_a"}),
  /team-access-forbidden/);
 assert.equal(forbidden.statements.at(-1)?.sql,"ROLLBACK");
 const identity=fixture();
 assert.deepEqual(await saveMemberAbsence(identity.db,memberId,"someone_else",
  creation,scope),{ok:false,error:"team-unavailable"});
 assert.equal(identity.statements.at(-1)?.sql,"ROLLBACK");
});
