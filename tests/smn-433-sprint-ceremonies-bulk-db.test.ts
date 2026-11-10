import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {changeSprintCeremonies} from "../src/server/sprints/ceremonies-bulk";

const teamId="4f2c7a29-2345-4567-8b9c-123456789abc";
const sprintId="3f2c7a29-2345-4567-8b9c-123456789abc";
function dbMock(options:{status?:string;counts?:number[];tables?:string[];fail?:string;missing?:boolean}={}){
 const calls:Array<{sql:string;params?:unknown[]}>=[],count=options.counts??[1,1,1];
 let index=0;
 const query=async(sql:string,params?:unknown[])=>{
  calls.push({sql,params});
  if(options.fail&&sql.includes(options.fail))
   throw Object.assign(new Error("foreign key"),{code:"23503"});
  if(sql.includes("SELECT s.id,s.status,s.start_at"))
   return {rows:options.missing?[]:[{id:sprintId,status:options.status??"active",startAt:"2026-11-10T09:00:00Z",endAt:"2026-11-21T17:00:00Z",timeZone:"Europe/Paris"}]};
  if(sql.includes("FROM information_schema.tables")){
   const tables=params?.[0] as string[];
   return {rows:(options.tables??tables).map(name=>({name}))};
  }
  if(sql.includes("COUNT(*)::text AS count"))
   return {rows:[{count:String(count[index++]??0)}]};
  if(sql.includes("SELECT id FROM public.smn_sprint_ceremony"))
   return {rows:[{id:"ceremony-one"}]};
  if(sql.includes("SELECT id FROM public.smn_scrum_template_occurrence"))
   return {rows:[{id:"template-one"}]};
  if(sql.includes("SELECT id FROM public.smn_sprint_exceptional_meeting"))
   return {rows:[{id:"exceptional-one"}]};
  return {rows:[],rowCount:1};
 };
 return {db:{query} as unknown as Client,calls};
}
test("suppression des trois catégories, une seule transaction et portée du sprint",async()=>{
 const {db,calls}=dbMock();
 assert.deepEqual(await changeSprintCeremonies(db,teamId,sprintId,"delete",3),{ok:true,count:3});
 assert.equal(calls[0].sql,"BEGIN");
 assert.equal(calls.at(-1)?.sql,"COMMIT");
 const deletes=calls.filter(c=>c.sql.includes("DELETE FROM public.smn_sprint_ceremony WHERE sprint_id"));
 assert.equal(deletes.length,1);
 assert.deepEqual(deletes[0].params,[sprintId]);
 assert(calls.some(c=>c.sql.includes("smn_sprint_exceptional_meeting_history")));
 assert(calls.some(c=>c.sql.includes("smn_scrum_template_occurrence_status_history")));
 assert(calls.some(c=>c.sql.includes("smn_calendar_meeting_outcome_link")));
});
test("compteur différent : rollback avant toute suppression",async()=>{
 const {db,calls}=dbMock({counts:[2,0,0]});
 assert.deepEqual(await changeSprintCeremonies(db,teamId,sprintId,"delete",1),{ok:false,error:"state-changed"}); // same count: one? 2 != 1
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert(!calls.some(c=>c.sql.includes("DELETE FROM public.")));
});
test("sprint clos : refus sans suppression",async()=>{
 const {db,calls}=dbMock({status:"closed"});
 assert.deepEqual(await changeSprintCeremonies(db,teamId,sprintId,"delete",3),{ok:false,error:"protected"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
});
test("échec FK : aucun COMMIT",async()=>{
 const {db,calls}=dbMock({fail:"DELETE FROM public.smn_sprint_exceptional_meeting_history"});
 assert.deepEqual(await changeSprintCeremonies(db,teamId,sprintId,"delete",3),{ok:false,error:"linked-data"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert(!calls.some(c=>c.sql==="COMMIT"));
});
test("sprint d'une autre équipe : non trouvé",async()=>{
 const {db,calls}=dbMock({missing:true});
 assert.deepEqual(await changeSprintCeremonies(db,teamId,sprintId,"delete",3),{ok:false,error:"not-found"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
});
test("ID incorrect : aucune transaction",async()=>{
 const {db,calls}=dbMock();
 assert.deepEqual(await changeSprintCeremonies(db,teamId,"not-an-id","create",0),
  {ok:false,error:"invalid-input"});
 assert.deepEqual(calls,[]);
});
