import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {readStoryPoints,writeStoryPoints} from "../src/server/sprints/story-points";
import {readSprintTickets,writeSprintTickets} from "../src/server/sprints/ticket-counts";
import {confirmHistoricalCsv} from "../src/server/historical-csv/confirm";

test("SMN-351 PG: v33 rejects obsolete writers and CSV without changing legacy relations",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const source=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(source.pathname==="/smn"||ci&&source.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(source.hostname))
  throw Error("Local PostgreSQL source required");
 const name="smn_351_retire_"+randomBytes(6).toString("hex");
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const target=new URL(source);target.pathname="/"+name;
 const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 let created=false;await admin.connect();
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin351",adminEmail:"admin351@example.test",password:"test-only-password351"},target.toString()),{ok:true});
  const db=new Client({connectionString:target.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   const cycleId=randomUUID(),actorId=randomUUID();
   assert.equal(await readStoryPoints(db,cycleId),null);
   assert.equal(await readSprintTickets(db,cycleId),null);
   const points=await writeStoryPoints(db,actorId,{sprintId:cycleId,revision:0,points:{initial:5,added:0,removed:0,done:3}});
   assert.deepEqual(points,{ok:false,error:"legacy-indicators-retired"});
   const tickets=await writeSprintTickets(db,actorId,{sprintId:cycleId,revision:0,counts:{initial:5,done:3}});
   assert.deepEqual(tickets,{ok:false,error:"legacy-indicators-retired"});
   const csv=await confirmHistoricalCsv(db,actorId,"",[]);
   assert.deepEqual(csv,{ok:false,error:"v33-indicator-mapping-required"});
   for(const relation of ["smn_sprint_story_points","smn_sprint_story_points_audit","smn_sprint_ticket_counts","smn_sprint_ticket_counts_audit"]){
    const count=await db.query<{n:string}>("SELECT 1 WHERE to_regclass($1) IS NOT NULL",["public."+relation]);
    assert.equal(count.rows.length,1);
    const data=await db.query<{n:string}>('SELECT count(*)::text n FROM public."'+relation+'"');
    assert.equal(data.rows[0].n,"0");
   }
  }finally{await db.end();}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}
  finally{await admin.end();}
 }
});
