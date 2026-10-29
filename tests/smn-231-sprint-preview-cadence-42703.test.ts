import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {previewSprintBatch} from "../src/server/sprints/batch-preview";

/**
 * Le contrat PostgreSQL officiel est celui de smn_scrum_cadence :
 * la suppression logique appartient aux Sprints, pas aux paramètres d'équipe.
 */
const cadenceColumns=new Set([
 "team_id","duration_weeks","start_day","start_time","end_day","end_time",
 "time_zone","revision","updated_at","updated_by"
]);

function dbFixture(){
 const queries:string[]=[];
 const db={query:async (sql:string,parameters?:unknown[])=>{
  queries.push(sql);
  if(sql.includes("CREATE TABLE IF NOT EXISTS"))return {rows:[],rowCount:0};
  if(sql.includes("SELECT t.id FROM public.smn_team t"))
   return {rows:[{id:"team-1"}],rowCount:1};
  if(sql.includes("INSERT INTO public.smn_scrum_cadence"))
   return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_scrum_cadence WHERE")){
   if(/\bdeleted_at\b/.test(sql))throw Object.assign(
    new Error("column deleted_at does not exist in smn_scrum_cadence"),{code:"42703"});
   return {rows:[{duration_weeks:2,start_day:1,start_time:"09:00:00",
    end_day:5,end_time:"18:00:00",time_zone:"Europe/Paris"}],rowCount:1};
  }
  if(sql.includes("SELECT id,name,start_at::text,end_at::text FROM public.smn_sprint"))
   return {rows:[],rowCount:0};
  if(sql.includes("SELECT COALESCE(MAX(number),0)+1"))
   return {rows:[{next_number:1}],rowCount:1};
  throw Error("Unexpected preview SQL");
 }} as unknown as Client;
 return {db,queries};
}

describe("SMN-231 — prévisualisation avec schéma de cadence réel (42703)",()=>{
 it("ne filtre jamais la cadence avec la colonne inexistante deleted_at",async()=>{
  const {db,queries}=dbFixture();
  const result=await previewSprintBatch(db,{startOn:"2026-10-26",count:2},"team-1");
  assert.equal(result.ok,true);
  if(!result.ok)return;
  assert.equal(result.items.length,2);
  assert.equal(result.valid,true);
  assert.equal(result.items[0].startOn,"2026-10-26");
  assert.equal(result.items[0].endOn,"2026-11-06");
  assert.equal(result.items[1].startOn,"2026-11-09");
  const cadenceSql=queries.find(sql=>sql.includes("FROM public.smn_scrum_cadence WHERE"));
  assert.ok(cadenceSql);
  assert.doesNotMatch(cadenceSql,/\bdeleted_at\b/);
  assert.match(cadenceSql,/WHERE team_id=\$1/);
 });
 it("conserve le filtrage des Sprints supprimés sans altérer la cadence",async()=>{
  const {db,queries}=dbFixture();
  await previewSprintBatch(db,{startOn:"2026-10-26",count:1},"team-1");
  const existing=queries.find(sql=>sql.includes("SELECT id,name,start_at::text,end_at::text FROM public.smn_sprint"));
  assert.ok(existing);
  assert.match(existing,/deleted_at IS NULL/);
  assert.equal(cadenceColumns.has("deleted_at"),false);
 });
});
