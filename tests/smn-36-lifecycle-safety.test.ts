import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {applyLifecycleAction,inspectMemberLifecycle,parseLifecycleAction}
 from "../src/server/members/lifecycle";
import {inspectMemberForeignReferences,MEMBER_REMOVAL_AUDIT_SQL}
 from "../src/server/members/removal-audit";

const memberId=randomUUID(),actorId=randomUUID();
function fixture(options:{referenced?:boolean;auditReady?:boolean;auditFailure?:boolean}={}){
 const executed:string[]=[];
 let committed={member:true,removalAudit:false,archived:false,revision:0};
 let staged={...committed};
 const response=(rows:unknown[])=>({rows,rowCount:rows.length});
 const client={query:async(sql:string,params:unknown[]=[])=>{
  executed.push(sql);
  if(sql==="BEGIN"){staged={...committed};return response([]);}
  if(sql==="ROLLBACK"){staged={...committed};return response([]);}
  if(sql==="COMMIT"){committed={...staged};return response([]);}
  if(sql.includes("pg_catalog.pg_constraint"))return response(
   options.referenced?[{table_name:'"public"."smn_member_absence"',column_name:"member_id",arity:1}]:[]
  );
  if(sql.includes('FROM "public"."smn_member_absence"')){
   return response([{n:options.referenced?"1":"0"}]);
  }
  if(sql.includes("FROM public.smn_member m"))
   return response(staged.member?[{id:memberId,revision:staged.revision,
    is_provisional:true,display_name:"Membre 2",email:null,archived_at:staged.archived?"2026-11-09":null,
    contract_percent:100,contribution_percent:100}]:[]);
  if(sql.includes("FROM public.smn_team t"))return response([{id:"team-one"}]);
  if(sql.includes("CURRENT_DATE::text AS today"))return response([{today:"2026-11-09"}]);
  if(sql.includes("FROM public.smn_member_assignment WHERE member_id=$1"))
   return response([]);
  if(sql.includes("SELECT count(DISTINCT member_id)"))return response([{active_count:0}]);
  if(sql.includes(" AS refs"))return response([{refs:0}]);
  if(sql.includes("to_regclass('public.smn_member_removal_audit')"))
   return response([{present:options.auditReady!==false,ready:options.auditReady!==false}]);
  if(sql.includes("DELETE FROM public.smn_member")){
   assert.equal(params[0],memberId);
   staged.member=false;return response([{id:memberId}]);
  }
  if(sql.includes("INSERT INTO public.smn_member_removal_audit")){
   if(options.auditFailure)throw Error("injected-audit-failure");
   assert.equal(staged.member,false);staged.removalAudit=true;return response([]);
  }
  if(sql.includes("UPDATE public.smn_member SET archived_at=now()")){
   staged.archived=true;staged.revision++;return response([]);
  }
  if(sql.includes("UPDATE public.smn_member SET archived_at=NULL")){
   staged.archived=false;staged.revision++;return response([]);
  }
  if(sql.includes("INSERT INTO public.smn_member_lifecycle_event"))return response([]);
  throw Error("unexpected SQL "+sql.slice(0,80));
 }} as unknown as Client;
 return {client,executed,state:()=>({...committed})};
}

describe("SMN-36 — archives réversibles et suppressions protégées",()=>{
 it("affiche un impact de FK réelles et refuse toute suppression référencée",async()=>{
  const f=fixture({referenced:true});
  const preview=await inspectMemberLifecycle(f.client,memberId);
  assert.equal(preview.deletionImpact.foreignReferenceCount,1);
  assert.equal(preview.canDelete,false);
  assert.equal(preview.deletionImpact.tables.length,1);
  const result=await applyLifecycleAction(f.client,memberId,actorId,
   {action:"delete",revision:0,confirmation:"SUPPRIMER"});
  assert.deepEqual(result,{ok:false,error:"historical-references"});
  assert.equal(f.state().member,true);
  assert.equal(f.executed.at(-1),"ROLLBACK");
 });
 it("garde l'identifiant et l'historique lors de l'archive et réactivation",async()=>{
  const f=fixture();
  assert.equal((await applyLifecycleAction(f.client,memberId,actorId,
   {action:"archive",revision:0})).ok,true);
  assert.equal(f.state().archived,true);
  assert.equal(f.state().member,true);
  assert.equal((await applyLifecycleAction(f.client,memberId,actorId,
   {action:"reactivate",revision:1})).ok,true);
  assert.equal(f.state().archived,false);
  assert.equal(f.state().member,true);
  assert.equal(f.executed.filter(s=>s.includes("INSERT INTO public.smn_member_lifecycle_event")).length,2);
 });
 it("supprime uniquement un membre provisoire vide avec audit distinct et validation",async()=>{
  const f=fixture();
  assert.equal((await inspectMemberLifecycle(f.client,memberId)).canDelete,true);
  assert.equal(parseLifecycleAction({action:"delete",revision:0,confirmation:"non"}),null);
  const result=await applyLifecycleAction(f.client,memberId,actorId,
   {action:"delete",revision:0,confirmation:"SUPPRIMER"});
  assert.equal(result.ok,true);
  assert.deepEqual(f.state(),{member:false,removalAudit:true,archived:false,revision:0});
  assert.equal(f.executed.at(-1),"COMMIT");
  assert.ok(!f.executed.some(s=>s.includes("INSERT INTO public.smn_member_lifecycle_event")));
 });
 it("une panne d'audit annule la suppression métier sans résultat partiel",async()=>{
  const f=fixture({auditFailure:true});
  await assert.rejects(()=>applyLifecycleAction(f.client,memberId,actorId,
   {action:"delete",revision:0,confirmation:"SUPPRIMER"}),/injected-audit-failure/);
  assert.equal(f.state().member,true);
  assert.equal(f.state().removalAudit,false);
  assert.equal(f.executed.at(-1),"ROLLBACK");
 });
 it("si le journal autonome n'existe pas, refuse par défaut",async()=>{
  const f=fixture({auditReady:false});
  const preview=await inspectMemberLifecycle(f.client,memberId);
  assert.equal(preview.canDelete,false);
  const result=await applyLifecycleAction(f.client,memberId,actorId,
   {action:"delete",revision:0,confirmation:"SUPPRIMER"});
  assert.deepEqual(result,{ok:false,error:"audit-not-ready"});
  assert.equal(f.state().member,true);
 });
 it("le DDL ne réintroduit ni FK vers la fiche supprimée ni donnée nominative",()=>{
  assert.match(MEMBER_REMOVAL_AUDIT_SQL,/member_id text NOT NULL/);
  assert.doesNotMatch(MEMBER_REMOVAL_AUDIT_SQL,/REFERENCES public.smn_member\(/);
  assert.doesNotMatch(MEMBER_REMOVAL_AUDIT_SQL,/display_name|email|full_name/);
 });
});
