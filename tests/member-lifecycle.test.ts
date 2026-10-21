import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseLifecycleAction,applyLifecycleAction} from "../src/server/members/lifecycle";
import {LIFECYCLE_MIGRATION_SQL} from "../src/server/members/lifecycle-migration";

const memberId=randomUUID(),assignmentId=randomUUID();
function fake(options:{closed?:boolean;archived?:boolean;hasReferences?:boolean;count?:number;empty?:boolean}={}){
 const queries:string[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  queries.push(sql);
  if(sql.includes("CURRENT_DATE::text AS today"))return {rows:[{today:"2026-10-21"}]};
  if(sql.includes("FROM public.smn_member m")&&sql.includes("WHERE m.id=$1"))
   return {rows:[{id:memberId,revision:2,is_provisional:!!options.empty,
    display_name:options.empty?"Membre 2":"Camille Martin",email:options.empty?null:"camille@example.org",
    contract_percent:100,contribution_percent:100,
    archived_at:options.archived?"2026-10-20T12:00:00Z":null}]};
  if(sql.includes("FROM public.smn_team t"))return {rows:[{id:"team"}]};
  if(sql.includes("FROM public.smn_member_assignment WHERE member_id=$1"))
   return {rows:options.empty?[]:[{id:assignmentId,team_id:"team",start_on:"2026-10-01",end_on:options.closed?"2026-10-19":null}]};
  if(sql.includes("max(effective_from)::text AS latest"))return {rows:[{latest:"2026-10-01"}]};
  if(sql.includes("active_count"))return {rows:[{active_count:options.count??3}]};
  if(sql.includes("count(*)::int AS refs"))return {rows:[{refs:options.hasReferences?1:0}]};
  if(sql.includes("confdeltype='c'"))return {rows:[{refs:0}]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,queries};
}
describe("Clôture, archivage et conservation de l'historique",()=>{
 it("valide les actions et leurs paramètres exacts",()=>{
  assert.equal(parseLifecycleAction({action:"close",assignmentId,endOn:"2026-10-21",revision:2})?.action,"close");
  assert.equal(parseLifecycleAction({action:"archive",revision:2})?.action,"archive");
  assert.equal(parseLifecycleAction({action:"reactivate",revision:2})?.action,"reactivate");
  assert.equal(parseLifecycleAction({action:"delete",revision:2,confirmation:"SUPPRIMER"})?.action,"delete");
  assert.equal(parseLifecycleAction({action:"archive",revision:-1}),null);
  assert.equal(parseLifecycleAction({action:"close",assignmentId,endOn:"2026-02-31",revision:2}),null);
  assert.equal(parseLifecycleAction({action:"delete",revision:2,confirmation:"non"}),null);
 });
 it("clôture sans effacer les versions; signale une équipe de deux",async()=>{
  const f=fake();
  const result=await applyLifecycleAction(f.db,memberId,"admin",
   {action:"close",assignmentId,endOn:"2026-10-21",revision:2});
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.activeCount,2);assert.equal(result.warning,"team-below-three");}
  assert.ok(f.queries.some(q=>q.includes("UPDATE public.smn_member_assignment SET end_on")));
  assert.ok(f.queries.every(q=>!q.includes("DELETE FROM public.smn_member_assignment")));
  assert.equal(f.queries.at(-1),"COMMIT");
 });
 it("archive après clôture, réactive sans dupliquer la personne",async()=>{
  const a=fake({closed:true});
  assert.equal((await applyLifecycleAction(a.db,memberId,"admin",{action:"archive",revision:2})).ok,true);
  assert.ok(a.queries.some(q=>q.includes("SET archived_at=now()")));
  const b=fake({closed:true,archived:true});
  assert.equal((await applyLifecycleAction(b.db,memberId,"admin",{action:"reactivate",revision:2})).ok,true);
  assert.ok(b.queries.some(q=>q.includes("SET archived_at=NULL")));
  assert.ok(b.queries.every(q=>!q.includes("INSERT INTO public.smn_member ")));
 });
 it("refuse archivage actif et suppression avec références",async()=>{
  const active=fake();
  assert.deepEqual(await applyLifecycleAction(active.db,memberId,"admin",{action:"archive",revision:2}),
   {ok:false,error:"assignment-still-open"});
  const historical=fake({closed:true,hasReferences:true});
  assert.deepEqual(await applyLifecycleAction(historical.db,memberId,"admin",
   {action:"delete",revision:2,confirmation:"SUPPRIMER"}),{ok:false,error:"historical-references"});
 });
 it("migration additive sans cascade",()=>{
  assert.match(LIFECYCLE_MIGRATION_SQL,/ADD COLUMN archived_at/);
  assert.match(LIFECYCLE_MIGRATION_SQL,/CREATE TABLE public.smn_member_lifecycle_event/);
  assert.match(LIFECYCLE_MIGRATION_SQL,/schema_version=12/);
  assert.doesNotMatch(LIFECYCLE_MIGRATION_SQL,/ON DELETE CASCADE/);
 });
});
