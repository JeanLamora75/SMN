import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {editCeremony} from "../src/server/sprints/ceremony-edits";
import {updateCalendarMeetingSchedule} from "../src/server/sprints/calendar-meeting-reschedule";

function version29(){
 const queries:string[]=[];
 const db={query:async(sql:string)=>{
  queries.push(sql);
  if(sql.includes("FROM public.smn_installation")&&sql.includes("schema_version"))
   return {rows:[{schema_version:29}]};
  throw Error("unexpected query");
 }} as unknown as Client;
 return {db,queries};
}
test("legacy ceremony edition blocks v29 before DDL",async()=>{
 const {db,queries}=version29();
 await assert.rejects(()=>editCeremony(db,"admin","aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",{
  startAt:"2026-11-02T09:00:00.000Z",minutes:30,scope:"single",revision:1
 }),/team-api-context-isolation-pending/);
 assert.equal(queries.some(sql=>/CREATE|ALTER|UPDATE|INSERT/.test(sql)),false);
});
test("legacy calendar reschedule blocks v29 before DDL",async()=>{
 const {db,queries}=version29();
 await assert.rejects(()=>updateCalendarMeetingSchedule(db,"admin",{
  kind:"template",id:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  startAt:"2026-11-02T09:00:00.000Z",endAt:"2026-11-02T09:30:00.000Z",revision:1
 }),/team-api-context-isolation-pending/);
 assert.equal(queries.some(sql=>/CREATE|ALTER|UPDATE|INSERT/.test(sql)),false);
});
