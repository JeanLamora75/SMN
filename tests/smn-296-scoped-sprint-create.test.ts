import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {createScopedSprint,parseScopedSprintCreate} from "../src/server/sprints/scoped-create";

test("l'équipe et la révision de cadence sont obligatoires",()=>{
 assert.equal(parseScopedSprintCreate({startOn:"2026-11-02",cadenceRevision:1}),null);
 assert.equal(parseScopedSprintCreate({teamId:"../team",startOn:"2026-11-02",cadenceRevision:1}),null);
 assert.equal(parseScopedSprintCreate({teamId:"team_a",startOn:"2026-11-02",cadenceRevision:0}),null);
});
function mock(archived=false){
 const queries:string[]=[];
 const query=async (sql:string)=>{
  queries.push(sql);
  if(sql.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:29}]};
  if(sql.includes("FROM public.smn_account_team_preference"))return {rows:[{team_id:"team_a"}]};
  if(sql.includes("LEFT JOIN public.smn_product"))return {rows:[{team_id:"team_a",mode:"scrum",team:"Team A",product:null,product_id:null}]};
  if(sql.includes("JOIN public.smn_account a ON"))return {rows:archived?[]:[{id:"team_a"}]};
  if(sql.includes("FROM public.smn_scrum_cadence"))return {rows:[{duration_weeks:2,start_day:1,start_time:"09:00",end_day:5,end_time:"18:00",time_zone:"Europe/Paris",revision:1}]};
  if(sql.includes("SELECT id FROM public.smn_sprint"))return {rows:[]};
  if(sql.includes("SELECT team_id FROM public.smn_sprint WHERE id="))return {rows:[{team_id:"team_a"}]};
  if(sql.includes("FROM public.smn_scrum_ceremony_template"))return {rows:[]};
  if(sql.includes("next_number"))return {rows:[{next_number:1}]};
  return {rows:[],rowCount:1};
 };
 return {db:{query} as unknown as Client,queries};
}
test("équipe archivée : rollback sans création",async()=>{
 const {db,queries}=mock(true);
 await assert.rejects(()=>createScopedSprint(db,{accountId:"admin",role:"admin"},
  {teamId:"team_a",startOn:"2026-11-02",cadenceRevision:1}),/scrum-team-unavailable/);
 assert.equal(queries.at(-1),"ROLLBACK");
 assert.equal(queries.some(s=>s.includes("INSERT INTO public.smn_sprint")),false);
});
test("équipe active : transaction, numéro et audit",async()=>{
 const {db,queries}=mock();
 const r=await createScopedSprint(db,{accountId:"admin",role:"admin"},
  {teamId:"team_a",startOn:"2026-11-02",cadenceRevision:1});
 assert.equal(r.ok,true);
 assert.ok(queries.some(s=>s.includes("INSERT INTO public.smn_sprint\n")));
 assert.ok(queries.some(s=>s.includes("INSERT INTO public.smn_sprint_audit")));
 assert.equal(queries.at(-1),"COMMIT");
 assert.ok(queries.some(s=>s.includes("SELECT team_id FROM public.smn_sprint WHERE id=")));
});
