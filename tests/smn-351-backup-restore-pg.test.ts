import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {inventoryRetiredCandidates} from "../scripts/smn-351-candidate-inventory";

test("SMN-351 PG: isolated candidate data survive pg_dump and pg_restore",{timeout:240000},async()=>{
 const source=new URL(await installedDatabaseUri());
 if(!["localhost","127.0.0.1","::1"].includes(source.hostname)||source.pathname!=="/smn")
  throw Error("Local /smn source required");
 const suffix=randomBytes(6).toString("hex");
 const original="smn_351_backup_"+suffix,restored="smn_351_restore_"+suffix;
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const uri=(name:string)=>{const u=new URL(source);u.pathname="/"+name;return u.toString();};
 const temp=mkdtempSync(join(tmpdir(),"smn-351-backup-"));
 const dump=join(temp,"proof.dump");
 const env:NodeJS.ProcessEnv={...process.env,PGHOST:source.hostname,
  PGPORT:source.port||"5432",PGUSER:decodeURIComponent(source.username),
  PGPASSWORD:decodeURIComponent(source.password)};
 const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 const owned:string[]=[];await admin.connect();
 const cli=(bin:string,args:string[])=>{
  const p=spawnSync(bin,args,{env,encoding:"utf8",windowsHide:true,timeout:120000,maxBuffer:1024*1024});
  if(p.error||p.status!==0)throw Error("PostgreSQL backup/restore failed: "+(p.error?.message??p.stderr.slice(0,500)));
 };
 try{
  for(const name of [original,restored]){await admin.query('CREATE DATABASE "'+name+'"');owned.push(name);}
  const result=await installExpress({adminUsername:"backup351",adminEmail:"backup351@example.test",password:"test-only-password351"},uri(original));
  assert.deepEqual(result,{ok:true});
  const read=async(name:string)=>{
   const db=new Client({connectionString:uri(name),connectionTimeoutMillis:3500});
   await db.connect();try{
    await db.query("BEGIN READ ONLY");
    try{const rows=await inventoryRetiredCandidates(db);await db.query("COMMIT");return rows;}
    catch(e){await db.query("ROLLBACK");throw e;}
   }finally{await db.end();}
  };
  const db=new Client({connectionString:uri(original),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   const team=randomUUID(),cycle=randomUUID();
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES($1,'singleton','Backup 351','scrum')",[team]);
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES($1,$2,1,'Backup Sprint',now()-interval '2 days',now(),'Europe/Paris','finished')",[cycle,team]);
   await db.query("INSERT INTO public.smn_sprint_story_points(sprint_id,initial_sp,done_sp) VALUES($1,21,18)",[cycle]);
   await db.query("INSERT INTO public.smn_sprint_ticket_counts(sprint_id,initial_tickets,done_tickets) VALUES($1,8,7)",[cycle]);
  }finally{await db.end();}
  const before=await read(original);
  assert.equal(before.find(x=>x.table==="smn_sprint_story_points")?.rows,"1");
  assert.equal(before.find(x=>x.table==="smn_sprint_ticket_counts")?.rows,"1");
  cli(process.env.SMN_PG_DUMP_PATH||"pg_dump",["--format=custom","--no-owner","--no-privileges","--no-password","--dbname="+original,"--file="+dump]);
  cli(process.env.SMN_PG_RESTORE_PATH||"pg_restore",["--exit-on-error","--no-owner","--no-privileges","--no-password","--dbname="+restored,dump]);
  const after=await read(restored);
  assert.deepEqual(after,before);
  console.log(JSON.stringify({proof:"smn-351-backup-restore",isolated:true,backupRestored:true,candidateRowsPreserved:true,cleanupAuthorized:false}));
 }finally{
  try{for(const name of owned.reverse()){
   if(!/^smn_351_(backup|restore)_[a-f0-9]{12}$/.test(name))throw Error("Unsafe test database cleanup");
   await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');
  }}finally{await admin.end();rmSync(temp,{recursive:true,force:true});}
 }
});
