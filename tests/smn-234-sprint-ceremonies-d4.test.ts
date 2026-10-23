import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {readSprintDetailCeremonies} from "../src/server/sprints/ceremonies-detail-read";
import {normalizeSprintCeremony,ceremonyPage,sortSprintCeremonies} from
 "../src/lib/sprint-ceremony-detail";
import {readFileSync} from "node:fs";

const sprintId="123e4567-e89b-42d3-a456-426614174000",teamId="team-1";
const id=(n:number)=>"123e4567-e89b-42d3-a456-"+String(n).padStart(12,"0");
const event=(n:number,kind:"standard"|"custom"|"exceptional"="standard")=>({
 id:id(n),source_kind:kind,kind:kind==="standard"?"daily":null,
 title:kind==="standard"?"daily":kind==="custom"?"Atelier d'équipe":"Réunion exceptionnelle",
 starts_at:new Date(Date.UTC(2026,9,10+n,8,0,0)),
 ends_at:new Date(Date.UTC(2026,9,10+n,8,15,0)),
 status:"scheduled",status_explicit:false,generation_source:"standard",
 planned_minutes:15,actual_minutes:null
});
function dbStub(reply:(sql:string,params?:readonly unknown[])=>{rows:unknown[]}) {
 const seen:{sql:string;params?:readonly unknown[]}[]=[];
 return {seen,db:{query:async(sql:string,params?:readonly unknown[])=>{
  assert.doesNotMatch(sql,/\b(CREATE|ALTER|UPDATE|INSERT|DELETE|DROP)\b/i);
  seen.push({sql,params});return reply(sql,params);
 }} as unknown as Client};
}
const columns=[
 ...["id","sprint_id","kind","starts_at","ends_at","minutes","occurrence_status","generation_source","status_explicit","actual_minutes"].map(column_name=>({table_name:"smn_sprint_ceremony",column_name})),
 ...["id","sprint_id","name","starts_at","ends_at","status","generation_source","status_explicit","actual_minutes"].map(column_name=>({table_name:"smn_scrum_template_occurrence",column_name})),
 ...["id","sprint_id","name","starts_at","ends_at","status","duration_minutes","status_explicit","actual_minutes"].map(column_name=>({table_name:"smn_sprint_exceptional_meeting",column_name}))
];

describe("SMN-234 D4 — cérémonie, statut et historique",()=>{
 it("distingue tenue attestée, tenue déduite, non tenue et reconstituée",()=>{
  const confirmed=normalizeSprintCeremony({...event(1),status:"held",status_explicit:true},false);
  const inferred=normalizeSprintCeremony({...event(2),status:"held",status_explicit:false},false);
  const reconstructed=normalizeSprintCeremony({...event(3),generation_source:"reconstructed"},false);
  assert.equal(confirmed?.status,"held");assert.equal(confirmed?.statusEvidence,"confirmed");
  assert.equal(inferred?.statusEvidence,"inferred");
  assert.equal(reconstructed?.reconstructed,true);assert.equal(reconstructed?.status,"scheduled");
  assert.equal(normalizeSprintCeremony({...event(4),status:"not_held"},false)?.status,"not_held");
  assert.equal(normalizeSprintCeremony({...event(5),status:"cancelled"},false)?.status,"cancelled");
  assert.equal(normalizeSprintCeremony({...event(6),status:"postponed"},false)?.status,"unknown");
 });
 it("n'invente ni durée réelle ni confirmation dans un snapshot ancien",()=>{
  const x=normalizeSprintCeremony({...event(1),status:"held",status_explicit:null,actual_minutes:null},true);
  assert.equal(x?.actualMinutes,null);assert.equal(x?.statusEvidence,"unknown");
  assert.equal(x?.plannedMinutes,15);
 });
 it("ordonne chronologiquement sans supprimer les réunions homonymes",()=>{
  const items=Array.from({length:205},(_,i)=>normalizeSprintCeremony(event(205-i),false)!);
  const ordered=sortSprintCeremonies(items);
  assert.equal(ordered.length,205);assert.equal(ordered[0].id,id(1));
  assert.equal(ceremonyPage(ordered,1,25).items.length,25);
  assert.equal(ceremonyPage(ordered,9,25).items.length,5);
  assert.equal(ceremonyPage(ordered,99999,25).page,9);
 });
 it("isole un Sprint hors équipe avant consultation des trois sources",async()=>{
  const x=dbStub(()=>({rows:[]}));
  assert.equal(await readSprintDetailCeremonies(x.db,teamId,sprintId,1),null);
  assert.equal(x.seen.length,1);
  assert.deepEqual(x.seen[0].params,[sprintId,teamId]);
 });
 it("lit le total réel et une page SQL de 25 sur trois sources",async()=>{
  const x=dbStub(sql=>{
   if(sql.includes("SELECT s.status"))return {rows:[{status:"active"}]};
   if(sql.includes("information_schema.columns"))return {rows:columns};
   if(sql.includes("COUNT(*)::text"))return {rows:[{total:"205"}]};
   if(sql.includes("LIMIT $2 OFFSET $3"))return {rows:[event(26),event(27)]};
   throw Error("SQL inattendu: "+sql);
  });
  const result=await readSprintDetailCeremonies(x.db,teamId,sprintId,2);
  assert.equal(result?.state,"available");
  if(result?.state==="available"){
   assert.equal(result.total,205);assert.equal(result.page,2);
   assert.equal(result.items.length,2);assert.equal(result.pageCount,9);
   assert.deepEqual(result.missingSources,[]);
  }
  assert.deepEqual(x.seen.at(-1)?.params,[sprintId,25,25]);
  assert.match(x.seen.at(-1)?.sql??"",/ORDER BY starts_at ASC/);
  assert.doesNotMatch(x.seen.at(-1)?.sql??"",/LIMIT 5\b/);
 });
 it("affiche une source partielle comme telle, pas comme exhaustive",async()=>{
  const onlyStandard=columns.filter(c=>c.table_name==="smn_sprint_ceremony");
  const x=dbStub(sql=>{
   if(sql.includes("SELECT s.status"))return {rows:[{status:"active"}]};
   if(sql.includes("information_schema.columns"))return {rows:onlyStandard};
   if(sql.includes("COUNT(*)::text"))return {rows:[{total:"0"}]};
   throw Error(sql);
  });
  const result=await readSprintDetailCeremonies(x.db,teamId,sprintId,1);
  assert.equal(result?.state,"available");
  if(result?.state==="available"){
   assert.equal(result.items.length,0);
   assert.deepEqual(result.missingSources,["custom","exceptional"]);
  }
 });
 it("lit le snapshot Vn sans consulter les réunions courantes",async()=>{
  const x=dbStub(sql=>{
   if(sql.includes("SELECT s.status"))return {rows:[{status:"closed"}]};
   if(sql.includes("to_regclass"))return {rows:[{present:true}]};
   if(sql.includes("SELECT version,snapshot"))return {rows:[{version:2,snapshot:{
    ceremonies:[{id:id(1),kind:"planning",starts_at:"2026-10-12T08:00:00Z",
      ends_at:"2026-10-12T10:00:00Z",status:"held",minutes:120,actual_minutes:130}],
    customMeetings:[],exceptionalMeetings:[]
   }}]};
   throw Error("Lecture courante interdite: "+sql);
  });
  const r=await readSprintDetailCeremonies(x.db,teamId,sprintId,1);
  assert.equal(r?.state,"available");
  if(r?.state==="available"){
   assert.equal(r.snapshotVersion,2);
   assert.equal(r.items[0].actualMinutes,130);
   assert.equal(r.items[0].statusEvidence,"unknown");
  }
  assert.ok(!x.seen.some(q=>q.sql.includes("information_schema.columns")));
 });
 it("n'invente pas un historique quand le snapshot est incomplet",async()=>{
  const x=dbStub(sql=>sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:1,snapshot:{ceremonies:[]}}]});
  assert.deepEqual(await readSprintDetailCeremonies(x.db,teamId,sprintId,1),
   {state:"unavailable",reason:"history-missing"});
 });
 it("la page Réunion standard reprend le statut réel au lieu de unknown",()=>{
  const code=readFileSync(new URL("../src/app/app/team-calendar/meeting/[kind]/[id]/page.tsx",import.meta.url),"utf8");
  assert.match(code,/kind==="ceremony"\?"occurrence_status":"status"/);
  assert.doesNotMatch(code,/'unknown' AS status/);
 });
});
