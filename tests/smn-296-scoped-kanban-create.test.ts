import assert from "node:assert/strict";
import {test} from "node:test";
import {parseScopedKanbanCreate,createScopedKanbanPeriod} from "../src/server/kanban/scoped-create";
import type {Client} from "pg";

test("team id and cadence revision are mandatory",()=>{
 assert.equal(parseScopedKanbanCreate({startOn:"2026-11-01",cadenceRevision:1}),null);
 assert.equal(parseScopedKanbanCreate({teamId:"../bad",startOn:"2026-11-01",cadenceRevision:1}),null);
 assert.equal(parseScopedKanbanCreate({teamId:"team_a",startOn:"2026-11-01",cadenceRevision:0}),null);
});

function dbMock(archived=false){
 const statements:string[]=[];
 const query=async(sql:string,params:unknown[]=[])=>{
  statements.push(sql);
  if(sql.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:29}]};
  if(sql.includes("FROM public.smn_account_team_preference"))return {rows:[{team_id:"team_a"}]};
  if(sql.includes("LEFT JOIN public.smn_product"))return {rows:[{team_id:"team_a",mode:"kanban",team:"A",product:null,product_id:null}]};
  if(sql.includes("JOIN public.smn_account a ON"))return {rows:archived?[]:[{id:"team_a"}]};
  if(sql.includes("FROM public.smn_kanban_cadence"))return {rows:[{frequency:"monthly",time_zone:"Europe/Paris",revision:1}]};
  if(sql.includes("SELECT id FROM public.smn_kanban_period"))return {rows:[]};
  return {rows:[],rowCount:1};
 };
 return {db:{query} as unknown as Client,statements};
}
test("archived team prevents write in same transaction",async()=>{
 const {db,statements}=dbMock(true);
 await assert.rejects(()=>createScopedKanbanPeriod(db,{accountId:"admin",role:"admin"},
  {teamId:"team_a",startOn:"2026-11-01",cadenceRevision:1}),/kanban-team-unavailable/);
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.equal(statements.some(s=>s.includes("INSERT INTO public.smn_kanban_period")),false);
});
test("authorized create atomically persists period and audit",async()=>{
 const {db,statements}=dbMock();
 const result=await createScopedKanbanPeriod(db,{accountId:"admin",role:"admin"},
  {teamId:"team_a",startOn:"2026-11-01",cadenceRevision:1});
 assert.equal(result.ok,true);
 assert.ok(statements.some(s=>s.includes("INSERT INTO public.smn_kanban_period")));
 assert.ok(statements.some(s=>s.includes("INSERT INTO public.smn_kanban_period_audit")));
 assert.equal(statements.at(-1),"COMMIT");
});
