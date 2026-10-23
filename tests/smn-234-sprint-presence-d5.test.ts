import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {
 presenceFromCapacity,presenceFromSnapshot,sprintPresenceDates
} from "../src/lib/sprint-presence";
import {readSprintMemberPresence} from "../src/server/sprints/presence-detail-read";
import {canAccess} from "../src/server/access-policy";
import type {SprintContextItem} from "../src/lib/sprint-context";

const sprint:SprintContextItem={
 id:"123e4567-e89b-42d3-a456-426614174000",
 name:"Sprint D5",status:"active",suspended:false,timeZone:"Europe/Paris",
 startAt:"2026-10-19T07:00:00.000Z",
 endAt:"2026-11-02T00:00:00.000Z"
};
const base={
 hoursPerJh:8,
 members:[{
  memberId:"member-1",displayName:"Produit Owner",totalJh:0,
  days:[
   {status:"calculated" as const,availableHalfDays:2},
   {status:"calculated" as const,availableHalfDays:1},
   {status:"calculated" as const,availableHalfDays:0}
  ]
 }]
};
const source=(path:string)=>
 readFileSync(new URL("../"+path,import.meta.url),"utf8");

describe("SMN-234 D5 — présence distincte du développement",()=>{
 it("calcule les J/H depuis les demi-journées, même pour un PO à 0 J/H développement",()=>{
  const result=presenceFromCapacity(base);
  assert.equal(result.members[0].presenceJh,1.5);
  assert.equal(result.members[0].developmentJh,0);
  assert.equal(result.totalPresenceJh,1.5);
  assert.equal(result.members[0].daysCount,3);
 });
 it("respecte le temps partiel exprimé par le calendrier sans multiplier une deuxième fois",()=>{
  const result=presenceFromCapacity({hoursPerJh:8,members:[{
   memberId:"mi",displayName:"Mi-temps",totalJh:0.6,
   days:Array.from({length:5},()=>({status:"calculated" as const,availableHalfDays:1}))
  }]});
  assert.equal(result.totalPresenceJh,2.5);
 });
 it("ne cumule pas les jours non affectés, les jours fériés ou les absences",()=>{
  const result=presenceFromCapacity({hoursPerJh:8,members:[{
   ...base.members[0],days:[
    {status:"calculated" as const,availableHalfDays:2},
    {status:"calculated" as const,availableHalfDays:0}, // férié / absence
    {status:"calculated" as const,availableHalfDays:1}
   ]}]});
  assert.equal(result.members[0].presenceJh,1.5);
 });
 it("laisse l'individuel et le total non calculables si une seule journée est inconnue",()=>{
  const result=presenceFromCapacity({hoursPerJh:8,members:[{
   ...base.members[0],days:[
    {status:"calculated" as const,availableHalfDays:2},
    {status:"not-calculable" as const,availableHalfDays:null}
   ]},{memberId:"known",displayName:"Contributeur",totalJh:1,
    days:[{status:"calculated" as const,availableHalfDays:2}]}]});
  assert.equal(result.members[0].presenceJh,null);
  assert.equal(result.members[0].unknownDays,1);
  assert.equal(result.members[1].presenceJh,1);
  assert.equal(result.totalPresenceJh,null);
 });
 it("distingue liste vide réelle de valeurs absentes",()=>{
  const p=presenceFromCapacity({hoursPerJh:8,members:[]});
  assert.deepEqual(p.members,[]);
  assert.equal(p.totalPresenceJh,0);
  assert.deepEqual(presenceFromSnapshot(undefined,1),
   {state:"unavailable",reason:"history-missing"});
 });
 it("utilise le fuseau IANA et exclut la borne de fin du Sprint",()=>{
  assert.deepEqual(sprintPresenceDates(sprint),
   {start:"2026-10-19",end:"2026-11-02"}); // 00:00Z Nov 2 is 01:00 Paris
  assert.deepEqual(sprintPresenceDates({...sprint,
   startAt:"2026-03-23T08:00:00.000Z",
   endAt:"2026-03-30T00:00:00.000Z"}),
   {start:"2026-03-23",end:"2026-03-30"});
  // End exactly local midnight is exclusive: do not count the next working day.
  assert.deepEqual(sprintPresenceDates({...sprint,
   startAt:"2026-10-19T07:00:00.000Z",
   endAt:"2026-11-01T23:00:00.000Z"}),
   {start:"2026-10-19",end:"2026-11-01"});
 });
 it("préserve le snapshot fiable sans réinterpréter les données après clôture",()=>{
  const current=presenceFromCapacity(base);
  const snapshot=presenceFromSnapshot(current,3);
  assert.equal(snapshot.state,"available");
  if(snapshot.state==="available"){
   assert.equal(snapshot.source,"closure-snapshot");
   assert.equal(snapshot.snapshotVersion,3);
   assert.equal(snapshot.members[0].presenceJh,1.5);
  }
 });
 it("refuse les snapshots incohérents et leurs fausses valeurs",()=>{
  const current=presenceFromCapacity(base);
  assert.deepEqual(presenceFromSnapshot({...current,totalPresenceJh:3},1),
   {state:"unavailable",reason:"read-failed"});
  assert.deepEqual(presenceFromSnapshot({...current,members:[{
   ...current.members[0],unknownDays:1,presenceJh:1.5}]},1),
   {state:"unavailable",reason:"read-failed"});
 });
});
function mockDb(resolve:(sql:string,params?:unknown[])=>{rows:unknown[]}){
 const queries:{sql:string;params?:unknown[]}[]=[];
 const db={query:async(sql:string,params?:unknown[])=>{
  queries.push({sql,params});return resolve(sql,params);
 }} as unknown as Client;
 return {db,queries};
}
describe("SMN-234 D5 — autorisations et snapshots",()=>{
 it("refuse un Sprint d'une autre équipe avant toute lecture nominative",async()=>{
  const f=mockDb(()=>({rows:[]}));
  const r=await readSprintMemberPresence(f.db,"team",sprint);
  assert.equal(r,null);
  assert.equal(f.queries.length,1);
  assert.deepEqual(f.queries[0].params,[sprint.id,"team"]);
 });
 it("un ancien Sprint clos sans snapshot de membres est indisponible sans recalcul",async()=>{
  const f=mockDb(sql=>
   sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:1,snapshot:{goals:[],capacity:{actual_jh:"5"}}}]});
  const r=await readSprintMemberPresence(f.db,"team",{...sprint,status:"closed"});
  assert.deepEqual(r,{state:"unavailable",reason:"history-missing"});
  assert.ok(!f.queries.some(x=>x.sql.includes("smn_member_assignment")));
 });
 it("l'absence de schéma de capacité est signalée plutôt que de montrer zéro",async()=>{
  const f=mockDb(sql=>sql.includes("SELECT s.status")?
   {rows:[{status:"active"}]}:{rows:[]});
  assert.deepEqual(await readSprintMemberPresence(f.db,"team",sprint),
   {state:"unavailable",reason:"schema-missing"});
  assert.ok(!f.queries.some(x=>x.sql.includes("SAVEPOINT")));
 });
 it("l'utilisateur n'a pas droit aux données nominatives ; l'admin oui",()=>{
  const user={role:"user",is_active:true,must_change_password:false};
  const admin={...user,role:"admin"};
  const target={type:"members",exists:true,inScope:true};
  assert.equal(canAccess(user,"read",target),false);
  assert.equal(canAccess(admin,"read",target),true);
  const page=source("src/app/app/admin/sprints/[sprintId]/page.tsx");
  assert.match(page,/active==="capacity"&&canViewMembers\?/);
  assert.match(page,/data=\{canViewMembers\?presence:null\}/);
 });
 it("la clôture sérialise les présences sans faire de migration dans le lecteur",()=>{
  const closure=source("src/server/sprints/closure.ts");
  const reader=source("src/server/sprints/presence-detail-read.ts");
  assert.match(closure,/memberPresence:/);
  assert.match(reader,/presenceFromSnapshot\(value,latest.version\)/);
  assert.doesNotMatch(reader,/CREATE TABLE|ALTER TABLE|INSERT INTO public/);
  assert.match(reader,/externalTransaction:true,includeExceptionalImpact:false/);
 });
});
