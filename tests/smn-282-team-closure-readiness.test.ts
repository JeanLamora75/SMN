import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {readTeamClosureReadiness} from "../src/server/teams/closure-readiness";

const admin={accountId:"admin",role:"admin"} as const;
type Opt={mode?:"scrum"|"kanban";status?:string;
 ended?:boolean;cycleFound?:boolean;missing?:string[]};
function fixture(opt:Opt={}){
 const calls:Array<{sql:string;params:unknown[]}>= [];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  calls.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:28}]};
  if(sql.includes("FROM public.smn_account_team_preference p"))
   return {rows:[{team_id:"wrong-team"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{team_id:"panda",team:"Panda",
    mode:opt.mode??"scrum",product_id:null,product:null}]};
  if(sql.includes("AS ended"))return {rows:opt.cycleFound===false?[]:
   [{status:opt.status??"finished",ended:opt.ended??true}]};
  if(sql.includes("to_regclass('public.'||x.name)")){
   const names=params[0] as string[];
   return {rows:names.map(name=>({
    name,exists:!opt.missing?.includes(name)
   }))};
  }
  throw Error("Unexpected SQL");
 }} as unknown as Client;
 return {db,calls};
}
test("Scrum : statut fini mais clôture désactivée tant que snapshot non qualifié",async()=>{
 const f=fixture();
 const r=await readTeamClosureReadiness(f.db,admin,"panda","sprint_1");
 assert.equal(r.mode,"scrum");
 assert.equal(r.stateEligible,true);
 assert.equal(r.canClose,false);
 assert.equal(r.snapshotPipelineQualified,false);
 assert.deepEqual(r.missingTables,[]);
 const scope=f.calls.find(x=>x.sql.includes("FROM public.smn_sprint s"));
 assert.deepEqual(scope?.params,["sprint_1","panda"]);
 assert.match(scope!.sql,/s.team_id=\$2/);
 assert.equal(f.calls.some(x=>/CREATE TABLE|ALTER TABLE|INSERT INTO|UPDATE public/i.test(x.sql)),false);
});
test("Kanban : période étrangère ou future non eligible",async()=>{
 const other=fixture({mode:"kanban",cycleFound:false});
 await assert.rejects(()=>readTeamClosureReadiness(other.db,
  admin,"panda","other_cycle"),/period-readiness-not-found/);
 const future=fixture({mode:"kanban",ended:false});
 const r=await readTeamClosureReadiness(future.db,admin,"panda","period_1");
 assert.equal(r.stateEligible,false);
 assert.equal(r.canClose,false);
 const q=future.calls.find(x=>x.sql.includes("FROM public.smn_kanban_period p"));
 assert.deepEqual(q?.params,["period_1","panda"]);
 assert.match(q!.sql,/p.team_id=\$2/);
});
test("Dépendance manquante explicite, sans création automatique",async()=>{
 const f=fixture({missing:["smn_sprint_closure_snapshot"]});
 const r=await readTeamClosureReadiness(f.db,admin,"panda","sprint_1");
 assert.deepEqual(r.missingTables,["smn_sprint_closure_snapshot"]);
 assert.equal(r.canClose,false);
});
test("Role user et identifiants forgés refusés",async()=>{
 const user=fixture();
 await assert.rejects(()=>readTeamClosureReadiness(user.db,
  {accountId:"user",role:"user"},"panda","sprint_1"),/team-access-forbidden/);
 assert.equal(user.calls.length,0);
 const forged=fixture();
 await assert.rejects(()=>readTeamClosureReadiness(forged.db,admin,
  "../wrong","sprint_1"),/period-readiness-invalid-input/);
 assert.equal(forged.calls.length,0);
});
