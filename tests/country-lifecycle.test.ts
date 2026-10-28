import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {inspectCountryLifecycle,changeCountryLifecycle,parseCountryLifecycleAction}
 from "../src/server/countries/lifecycle";

type Options={archived?:boolean;revision?:number;reference?:boolean;members?:number;auditError?:boolean};
function fixture(options:Options={}){
 const sql:string[]=[],params:unknown[][]=[];
 let revision=options.revision??2, archived=options.archived??false;
 const db={query:async(q:string,p:unknown[]=[])=>{
  sql.push(q);params.push(p);
  if(q.includes("to_regclass('public.smn_country_name_audit')"))
   return {rows:[{schema_version:30,ready:true}],rowCount:1};
  if(q==="BEGIN"||q==="COMMIT"||q==="ROLLBACK"||q.includes("pg_advisory_xact_lock")||
    q.includes("CREATE TABLE")||q.includes("CREATE INDEX")||q.includes("ALTER TABLE"))
    return {rows:[],rowCount:0};
  if(q.includes("SELECT code,name,revision,archived_at::text AS archived_at"))
    return {rows:[{code:"FR",name:"France",revision,archived_at:archived?"2026-10-20":null}],rowCount:1};
  if(q.includes("SELECT reference_country FROM public.smn_general_settings"))
    return {rows:[{reference_country:options.reference?"FR":"DE"}],rowCount:1};
  if(q.includes("WITH candidate AS")){
    const count=options.members??0;
    return {rows:Array.from({length:Math.min(21,count)},(_,i)=>({
     id:"id-"+i,name:"Membre "+i,total:String(count)
    })),rowCount:Math.min(21,count)};
  }
  if(q.includes("UPDATE public.smn_country")){
    revision++;archived=p[1]==="archive";
    return {rows:[{revision,archived_at:archived?"2026-10-26":null}],rowCount:1};
  }
  if(q.includes("INSERT INTO public.smn_country_lifecycle_audit")){
    if(options.auditError)throw Error("audit-failed");
    return {rows:[],rowCount:1};
  }
  throw Error("SQL unexpected: "+q);
 }} as unknown as Client;
 return {db,sql,params};
}
describe("SMN-279 — archivage réversible des pays",()=>{
 it("refuse les requêtes sans confirmation et les révisions invalides",()=>{
  assert.equal(parseCountryLifecycleAction({action:"archive",revision:1,confirmed:false}),null);
  assert.equal(parseCountryLifecycleAction({action:"archive",revision:-1,confirmed:true}),null);
  assert.equal(parseCountryLifecycleAction({action:"delete",revision:1,confirmed:true}),null);
  assert.equal(parseCountryLifecycleAction({action:"archive",revision:1,confirmed:true,force:true}),null);
  assert.deepEqual(parseCountryLifecycleAction({action:"reactivate",revision:2,confirmed:true}),
   {action:"reactivate",revision:2,confirmed:true});
 });
 it("refuse un pays de référence même sans membre actif",async()=>{
  const f=fixture({reference:true});
  const r=await changeCountryLifecycle(f.db,"FR","admin",
   {action:"archive",revision:2,confirmed:true});
  assert.equal(r.ok,false);
  if(!r.ok)assert.equal(r.error,"reference-country");
  assert.equal(f.sql.at(-1),"ROLLBACK");
  assert.ok(!f.sql.some(x=>x.includes("UPDATE public.smn_country")));
 });
 it("refuse les membres actifs et fournit leur nombre et des IDs limités",async()=>{
  const f=fixture({members:24});
  const r=await changeCountryLifecycle(f.db,"FR","admin",
   {action:"archive",revision:2,confirmed:true});
  assert.equal(r.ok,false);
  if(!r.ok){
   assert.equal(r.error,"active-members");
   assert.equal(r.impact?.activeMemberCount,24);
   assert.equal(r.impact?.linkedMembers.length,20);
   assert.equal(r.impact?.membersTruncated,true);
  }
  assert.equal(f.sql.at(-1),"ROLLBACK");
 });
 it("détecte les révisions périmées sans écriture",async()=>{
  const f=fixture({revision:4});
  const r=await changeCountryLifecycle(f.db,"FR","admin",
   {action:"archive",revision:3,confirmed:true});
  assert.equal(r.ok,false);
  if(!r.ok)assert.equal(r.error,"conflict");
  assert.equal(f.sql.at(-1),"ROLLBACK");
 });
 it("archive et journalise atomiquement sans supprimer de jours fériés ni membres",async()=>{
  const f=fixture();
  const r=await changeCountryLifecycle(f.db,"FR","admin",
   {action:"archive",revision:2,confirmed:true});
  assert.deepEqual(r,{ok:true,action:"archive",code:"FR",revision:3,archived:true});
  assert.equal(f.sql.at(-1),"COMMIT");
  const lock=f.sql.indexOf("SELECT pg_advisory_xact_lock(20261026,279)");
  const members=f.sql.findIndex(x=>x.includes("WITH candidate AS"));
  const mutation=f.sql.findIndex(x=>x.includes("UPDATE public.smn_country"));
  assert.ok(lock>=0&&members>lock&&mutation>members);
  assert.equal(f.sql.filter(x=>x.includes("INSERT INTO public.smn_country_lifecycle_audit")).length,1);
  assert.ok(!f.sql.some(x=>x.includes("DELETE FROM public.smn_")||
    x.includes("UPDATE public.smn_member_location")));
 });
 it("réactive le même code avec sa révision et son historique",async()=>{
  const f=fixture({archived:true,revision:3});
  const impact=await inspectCountryLifecycle(f.db,"FR");
  assert.equal(impact?.canReactivate,true);
  const r=await changeCountryLifecycle(f.db,"FR","admin",
   {action:"reactivate",revision:3,confirmed:true});
  assert.deepEqual(r,{ok:true,action:"reactivate",code:"FR",revision:4,archived:false});
 });
 it("échec d'audit entraîne rollback",async()=>{
  const f=fixture({auditError:true});
  await assert.rejects(()=>changeCountryLifecycle(f.db,"FR","admin",
   {action:"archive",revision:2,confirmed:true}),/audit-failed/);
  assert.equal(f.sql.at(-1),"ROLLBACK");
 });
});
