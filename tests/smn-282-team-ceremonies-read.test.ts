import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {readTeamCeremonies} from "../src/server/teams/ceremonies-read";

const admin={accountId:"admin",role:"admin"} as const;
type Opt={mode?:string;sprint?:boolean;ready?:boolean;many?:boolean};
function fixture(opt:Opt={}){
 const calls:Array<{sql:string;params:unknown[]}>= [];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  calls.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:28}]};
  if(sql.includes("FROM public.smn_account_team_preference p"))
   return {rows:[{team_id:"wrong"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{team_id:"panda",team:"Panda",product_id:null,
    product:null,mode:opt.mode??"scrum"}]};
  if(sql.includes("SELECT s.id,s.status FROM public.smn_sprint"))
   return {rows:opt.sprint===false?[]:[{id:"sprint_panda",status:"active"}]};
  if(sql.includes("to_regclass"))
   return {rows:opt.ready===false?[]:[{name:"ceremony"},{name:"template"}]};
  if(sql.includes("'ceremony'::text AS source")){
   const row={id:"ceremony1",source:"ceremony",name:"daily",
    status:"scheduled",start_at:"2026-10-28T09:00:00Z",
    end_at:"2026-10-28T09:15:00Z",revision:2};
   return {rows:opt.many?Array(501).fill(row):[row]};
  }
  throw Error("Unexpected SQL");
 }} as unknown as Client;
 return {db,calls};
}
test("Scrum : liste filtrée par équipe et Sprint, lecture seulement",async()=>{
 const f=fixture();
 const r=await readTeamCeremonies(f.db,admin,"panda","sprint_panda");
 assert.equal(r.teamId,"panda");
 assert.equal(r.items.length,1);
 assert.equal(r.items[0].revision,2);
 const scope=f.calls.find(x=>x.sql.includes("SELECT s.id,s.status"));
 assert.deepEqual(scope?.params,["sprint_panda","panda"]);
 const list=f.calls.find(x=>x.sql.includes("'ceremony'::text AS source"));
 assert.deepEqual(list?.params,["sprint_panda","panda"]);
 assert.match(list!.sql,/s.team_id=\$2/g);
 assert.equal(f.calls.some(x=>/INSERT INTO|CREATE TABLE|UPDATE public|DELETE FROM/.test(x.sql)),false);
});
test("Sprint étranger : aucune occurrence divulguée",async()=>{
 const f=fixture({sprint:false});
 await assert.rejects(()=>readTeamCeremonies(f.db,admin,
  "panda","foreign"),/team-ceremony-sprint-not-found/);
 assert.equal(f.calls.some(x=>x.sql.includes("'ceremony'::text AS source")),false);
});
test("Schéma non prêt ou résultat trop gros : échec explicite sans DDL",async()=>{
 const missing=fixture({ready:false});
 await assert.rejects(()=>readTeamCeremonies(missing.db,admin,
  "panda","sprint_panda"),/team-ceremony-storage-not-ready/);
 const huge=fixture({many:true});
 await assert.rejects(()=>readTeamCeremonies(huge.db,admin,
  "panda","sprint_panda"),/team-ceremony-list-limit/);
});
test("Kanban et compte user refusés",async()=>{
 const kanban=fixture({mode:"kanban"});
 await assert.rejects(()=>readTeamCeremonies(kanban.db,admin,
  "panda","sprint_panda"),/team-ceremony-mode-invalid/);
 const user=fixture();
 await assert.rejects(()=>readTeamCeremonies(user.db,
  {accountId:"user",role:"user"},"panda","sprint_panda"),
  /team-access-forbidden/);
 assert.equal(user.calls.length,0);
});
