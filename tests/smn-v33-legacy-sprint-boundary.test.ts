import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {readStoryPoints,writeStoryPoints} from "../src/server/sprints/story-points";
import {readSprintTickets,writeSprintTickets} from "../src/server/sprints/ticket-counts";
import {readSprintDetailIndicators} from "../src/server/sprints/indicators-read";

const id="123e4567-e89b-42d3-a456-426614174000";
function mock(status:"active"|"closed"){
 const sql:string[]=[];
 const db={query:async(query:string)=>{
  sql.push(query);
  if(query.includes("SELECT schema_version FROM public.smn_installation"))
   return {rows:[{schema_version:33}]};
  if(query.includes("SELECT s.status FROM public.smn_sprint"))
   return {rows:[{status}]};
  if(query.includes("to_regclass('public.smn_sprint_closure_snapshot')"))
   return {rows:[{present:true}]};
  if(query.includes("SELECT version,snapshot FROM public.smn_sprint_closure_snapshot"))
   return {rows:[{version:2,snapshot:{
    storyPoints:{initial_sp:"8",added_sp:"2",removed_sp:"0",done_sp:"7"},
    ticketCounts:{initial_tickets:"4",done_tickets:"0"},
    confidenceClarity:{confidence:4,clarity:5}
   }}]};
  return {rows:[]};
 }} as unknown as Client;
 return {db,sql};
}
test("v33: old entry points never read current retired metric tables",async()=>{
 const f=mock("active");
 assert.equal(await readStoryPoints(f.db,id),null);
 assert.equal(await readSprintTickets(f.db,id),null);
 assert.deepEqual(await readSprintDetailIndicators(f.db,"team-1",id),
  {state:"unavailable",reason:"schema-missing"});
 assert.ok(!f.sql.some(q=>/FROM public\.smn_sprint_(story_points|ticket_counts)\b/.test(q)));
});
test("v33: legacy metric writes fail closed before transaction or legacy DML",async()=>{
 const f=mock("active");
 const points=await writeStoryPoints(f.db,"account",{sprintId:id,revision:0,
  points:{initial:8,added:2,removed:0,done:7}});
 const tickets=await writeSprintTickets(f.db,"account",{sprintId:id,revision:0,
  counts:{initial:4,done:0}});
 assert.deepEqual(points,{ok:false,error:"legacy-indicators-retired"});
 assert.deepEqual(tickets,{ok:false,error:"legacy-indicators-retired"});
 assert.ok(!f.sql.some(q=>/\b(BEGIN|INSERT|UPDATE|DELETE)\b/.test(q)));
});
test("v33: closed Sprint still reads frozen V2 metrics, never current values",async()=>{
 const f=mock("closed");
 const result=await readSprintDetailIndicators(f.db,"team-1",id);
 assert.equal(result?.state,"available");
 if(result?.state!=="available")return;
 assert.equal(result.source,"closure-snapshot");
 assert.equal(result.snapshotVersion,2);
 assert.equal(result.points.state,"available");
 assert.equal(result.tickets.state,"available");
 if(result.points.state==="available")assert.deepEqual(result.points.values,
  {initial:8,added:2,removed:0,done:7});
 if(result.tickets.state==="available")assert.deepEqual(result.tickets.values,
  {initial:4,done:0});
 assert.ok(!f.sql.some(q=>/FROM public\.smn_sprint_(story_points|ticket_counts)\b/.test(q)));
});
