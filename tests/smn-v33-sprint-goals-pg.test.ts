import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {readSprintGoals,writeSprintGoal} from "../src/server/sprints/goals";

test("PG18 — native v33 sprint goals persist in their team with immutable audit",
 {skip:process.env.GITHUB_ACTIONS!=="true"||process.env.CI!=="true",timeout:240000},
 async()=>{
  const raw=process.env.SMN_TEST_DATABASE_URL;
  if(!raw)throw Error("Dedicated PG18 maintenance URL required");
  const maintenance=new URL(raw);
  if(!["localhost","127.0.0.1","[::1]"].includes(maintenance.hostname)||
    maintenance.pathname!=="/postgres"||
    !["postgres:","postgresql:"].includes(maintenance.protocol))
   throw Error("Refusing non-disposable PG18 database");
  const name="smn_goals_test_"+randomUUID().replaceAll("-","").slice(0,12);
  const url=new URL(maintenance);url.pathname="/"+name;
  const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
  let created=false;
  try{
   await admin.connect();
   const version=await admin.query<{version:string}>(
    "SELECT current_setting('server_version') AS version");
   assert.match(version.rows[0]?.version??"",/^18\./);
   await admin.query('CREATE DATABASE "'+name+'"');
   created=true;
   assert.deepEqual(await installExpress({
    adminUsername:"goals-admin",adminEmail:"goals@example.test",
    password:"TestOnlyGoalsPassword_2026_11"
   },url.toString()),{ok:true});
   const db=new Client({connectionString:url.toString(),connectionTimeoutMillis:3500});
   try{
    await db.connect();
    await db.query("UPDATE public.smn_account SET must_change_password=false WHERE username='goals-admin'");
    const row=await db.query<{id:string}>(
     "SELECT id FROM public.smn_account WHERE username='goals-admin'");
    const actorId=row.rows[0]?.id;
    assert.ok(actorId);
    await db.query(`INSERT INTO public.smn_team(id,installation_id,name,agile_mode)
     VALUES('goalsteam1','singleton','Team 1','scrum'),
           ('goalsteam2','singleton','Team 2','scrum')`);
    const sprintId=randomUUID();
    await db.query(`INSERT INTO public.smn_sprint
      (id,team_id,number,name,start_at,end_at,time_zone,created_by)
      VALUES($1,'goalsteam1',1,'Sprint objectif','2026-11-02T09:00:00Z',
       '2026-11-13T18:00:00Z','Europe/Paris',$2)`,[sprintId,actorId]);
    const actor={accountId:actorId,role:"admin" as const};
    const team1={actor,teamId:"goalsteam1"};
    const team2={actor,teamId:"goalsteam2"};
    const createdGoal=await writeSprintGoal(db,actorId,{
     sprintId,title:" Objectif v33 ",evaluation:"not_evaluated",comment:null
    },team1);
    assert.equal(createdGoal.ok,true);
    if(!createdGoal.ok)throw Error("goal-not-created");
    let read=await readSprintGoals(db,sprintId,team1);
    assert.equal(read?.goals.length,1);
    assert.equal((read?.goals[0] as {title:string}).title,"Objectif v33");
    const updated=await writeSprintGoal(db,actorId,{
     sprintId,id:createdGoal.id,revision:1,title:"Objectif modifié",
     evaluation:"partially_achieved",comment:"Détail"
    },team1);
    assert.equal(updated.ok,true);
    const stale=await writeSprintGoal(db,actorId,{
     sprintId,id:createdGoal.id,revision:1,title:"Conflit",
     evaluation:"not_evaluated",comment:null
    },team1);
    assert.deepEqual(stale,{ok:false,error:"conflict"});
    const other=await writeSprintGoal(db,actorId,{
     sprintId,title:"Équipe étrangère",evaluation:"not_evaluated",comment:null
    },team2);
    assert.deepEqual(other,{ok:false,error:"not-found"});
    assert.equal(await readSprintGoals(db,sprintId,team2),null);
    read=await readSprintGoals(db,sprintId,team1);
    assert.equal((read?.goals[0] as {title:string}).title,"Objectif modifié");
    const audit=await db.query<{count:string}>(
     "SELECT COUNT(*)::text AS count FROM public.smn_sprint_goal_audit WHERE goal_id=$1",
     [createdGoal.id]);
    assert.equal(audit.rows[0]?.count,"2");
    process.stdout.write("SMN-GOALS-V33-PG18: create/update/audit/team isolation verified\n");
   }finally{await db.end().catch(()=>undefined);}
  }finally{
   if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)').catch(()=>undefined);
   await admin.end().catch(()=>undefined);
  }
 });
