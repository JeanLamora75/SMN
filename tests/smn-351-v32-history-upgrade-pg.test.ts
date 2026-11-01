import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID,createHash} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {nativeBaselineSql,NATIVE_V32_NAME} from "../src/server/installation/native-v32";
import {applyV33} from "../scripts/apply-smn-338-v33";
import {readStoryPoints} from "../src/server/sprints/story-points";
import {readSprintTickets} from "../src/server/sprints/ticket-counts";

/** Only a scratch database may be created/dropped. The installed /smn database is never mutated. */
test("SMN-351 PG: legacy v32 history survives isolated upgrade to v33",{timeout:180000},async()=>{
 const source=new URL(await installedDatabaseUri());
 if(!["postgres:","postgresql:"].includes(source.protocol)||
  !["localhost","127.0.0.1","::1"].includes(source.hostname)||source.pathname!=="/smn")
  throw Error("Local /smn source required");
 const name="smn_351_history_"+randomBytes(6).toString("hex");
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const target=new URL(source);target.pathname="/"+name;
 const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 let created=false;await admin.connect();
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  const db=new Client({connectionString:target.toString(),connectionTimeoutMillis:3500,statement_timeout:60000});
  await db.connect();
  try{
   const baseline=nativeBaselineSql();
   await db.query("BEGIN");
   try{
    await db.query(baseline);
    await db.query("INSERT INTO public.smn_installation(id,state,schema_version) VALUES('singleton','initialized',32)");
    await db.query("INSERT INTO public._prisma_migrations(id,checksum,finished_at,migration_name,applied_steps_count) VALUES($1,$2,now(),$3,1)",
      [randomUUID(),createHash("sha256").update(baseline).digest("hex"),NATIVE_V32_NAME]);
    await db.query("COMMIT");
   }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
   const team=randomUUID(),cycle=randomUUID(),account=randomUUID();
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES($1,'singleton','Historique conservé','scrum')",[team]);
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES($1,$2,1,'Cycle historique',now()-interval '20 days',now()-interval '10 days','Europe/Paris','closed')",[cycle,team]);
   await db.query("INSERT INTO public.smn_sprint_story_points(sprint_id,initial_sp,added_sp,removed_sp,done_sp) VALUES($1,13,3,1,11)",[cycle]);
   await db.query("INSERT INTO public.smn_sprint_ticket_counts(sprint_id,initial_tickets,done_tickets) VALUES($1,7,6)",[cycle]);
   const snapshot={storyPoints:{initial_sp:"13",done_sp:"11"},ticketCounts:{initial_tickets:"7",done_tickets:"6"},historicalTag:"SMN-351-proof"};
   await db.query("INSERT INTO public.smn_sprint_closure_snapshot(id,sprint_id,version,snapshot,actor_id) VALUES($1,$2,1,$3::jsonb,$4)",[randomUUID(),cycle,JSON.stringify(snapshot),account]);
   const check=async()=>({
    team:(await db.query<{name:string}>("SELECT name FROM public.smn_team WHERE id=$1",[team])).rows[0]?.name,
    cycle:(await db.query<{status:string}>("SELECT status FROM public.smn_sprint WHERE id=$1",[cycle])).rows[0]?.status,
    points:(await db.query<{initial_sp:string;done_sp:string}>("SELECT initial_sp::text,done_sp::text FROM public.smn_sprint_story_points WHERE sprint_id=$1",[cycle])).rows[0],
    tickets:(await db.query<{initial_tickets:string;done_tickets:string}>("SELECT initial_tickets::text,done_tickets::text FROM public.smn_sprint_ticket_counts WHERE sprint_id=$1",[cycle])).rows[0],
    snapshot:(await db.query<{snapshot:unknown}>("SELECT snapshot FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1 AND version=1",[cycle])).rows[0]?.snapshot
   });
   const before=await check();
   assert.equal(before.team,"Historique conservé");
   assert.equal(before.cycle,"closed");
   assert.deepEqual(before.snapshot,snapshot);
   const migrated=await applyV33(db,true);
   assert.equal(migrated.applied,true);
   assert.equal((await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton'")).rows[0]?.schema_version,33);
   assert.deepEqual(await check(),before,"Historique v32 bit-for-bit preserved across v33 upgrade");
   assert.equal(await readStoryPoints(db,cycle),null,"v33 must not read retired live sources");
   assert.equal(await readSprintTickets(db,cycle),null,"v33 must not read retired live ticket sources");
   const revisions=await db.query("SELECT id,sprint_id,version,snapshot FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1",[cycle]);
   assert.equal(revisions.rows.length,1);
   console.log(JSON.stringify({proof:"historical-v32-upgrade",isolated:true,historyPreserved:true,cycleId:cycle,cleanupAuthorized:false}));
  }finally{await db.end();}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}
  finally{await admin.end();}
 }
});
