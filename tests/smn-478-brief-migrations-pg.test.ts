import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID,createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {applySmn472} from "../scripts/apply-smn-472-prompt-text";
import {applyBriefCleanup,inspectBriefCleanup} from "../scripts/apply-smn-477-brief-cleanup";

const legacySql=readFileSync(new URL("../prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql",import.meta.url),"utf8");
const addSql=readFileSync(new URL("../prisma/migrations/20261116_smn472_prompt_text/migration.sql",import.meta.url),"utf8");
function digest(s:string){return createHash("sha256").update(s,"utf8").digest("hex");}
async function localDatabase(){
 const raw=new URL(await installedDatabaseUri());
 if(!["postgres:","postgresql:"].includes(raw.protocol)||raw.pathname!=="/smn"||
  !["localhost","127.0.0.1","::1"].includes(raw.hostname))throw Error("smn478-must-use-local-test-postgres");
 const adminUri=new URL(raw);adminUri.pathname="/postgres";
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();
 const permission=await admin.query<{allowed:boolean}>(
  "SELECT (rolcreatedb OR rolsuper) AS allowed FROM pg_roles WHERE rolname=current_user");
 if(!permission.rows[0]?.allowed){await admin.end();throw Error("smn478-createdb-permission-required");}
 const name="smn478_disposable_"+randomBytes(6).toString("hex");
 const target=new URL(raw);target.pathname="/"+name;
 await admin.query('CREATE DATABASE "'+name+'"');
 const db=new Client({connectionString:target.toString(),connectionTimeoutMillis:3500,statement_timeout:25000});
 try{await db.connect();return {db,admin,name};}
 catch(e){await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');await admin.end();throw e;}
}
async function withDisposable(work:(db:Client)=>Promise<void>){
 const {db,admin,name}=await localDatabase();
 try{await work(db);}
 finally{
  await db.end().catch(()=>undefined);
  try{await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}
  finally{await admin.end();}
 }
}
test("SMN-478: empty legacy database → additive 472 → final 477; safe repetition",{timeout:120000},async()=>{
 await withDisposable(async db=>{
  await db.query(legacySql);
  await db.query(addSql);
  const before=await inspectBriefCleanup(db);
  assert.equal(before.templates,0);assert.equal(before.archives,0);
  assert.equal(before.columns.length,5);
  assert.equal((await applySmn472(db,true)).ready,true);
  const first=await applyBriefCleanup(db,true);
  assert.equal(first.applied,true);
  assert.deepEqual(first.after.columns,[]);
  const second=await applyBriefCleanup(db,true);
  assert.equal(second.applied,true);
  assert.deepEqual(second.after.columns,[]);
 });
});
test("SMN-478: custom templates, historical archives and SHA256 survive migration and rollback",{timeout:120000},async()=>{
 await withDisposable(async db=>{
  await db.query(legacySql);
  const id=randomUUID(),archiveId=randomUUID(),author=randomUUID();
  const body="Immutable historical TXT — préserve l'intégrité\n";
  const old={sections:["Results","Risks"],questions:["What changed?"],instructions:["Avoid invented numbers"],
   data:["cycle.name","scrum.storyPoints.completed"],depth:3};
  await db.query(`INSERT INTO public.smn_ai_brief_template
   (id,title,description,sections,questions,instructions,data,depth,revision,active,created_by)
   VALUES ($1,'Legacy custom model','Saved before upgrade',$2,$3,$4,$5,$6,7,true,$7)`,
   [id,JSON.stringify(old.sections),JSON.stringify(old.questions),JSON.stringify(old.instructions),
   JSON.stringify(old.data),old.depth,author]);
  await db.query(`INSERT INTO public.smn_ai_brief_archive
   (id,mode,cycle_id,team_id,template_id,template_revision,author_id,sha256,byte_length,content,reviewed)
   VALUES ($1,'scrum',$2,$3,$4,7,$5,$6,$7,$8,true)`,
   [archiveId,randomUUID(),randomUUID(),id,author,digest(body),Buffer.byteLength(body),Buffer.from(body)]);
  const original=await db.query<{id:string;revision:number}>(
   "SELECT id::text,revision FROM public.smn_ai_brief_template");
  const saved=await db.query<{id:string;template_id:string;template_revision:number;sha256:string;content:Buffer}>(
   "SELECT id::text,template_id,template_revision,sha256,content FROM public.smn_ai_brief_archive");
  await db.query(addSql);
  // Missing backfill blocks destructive cleanup and rolls it back.
  await assert.rejects(()=>applyBriefCleanup(db,true),/backfill non terminé/);
  const partial=await inspectBriefCleanup(db);
  assert.equal(partial.columns.length,5);assert.equal(partial.archives,1);
  const migration=await applySmn472(db,true);
  assert.equal(migration.pending,1);
  const converted=await db.query<{prompt_text:string;revision:number}>(
   "SELECT prompt_text,revision FROM public.smn_ai_brief_template WHERE id=$1",[id]);
  for(const value of [...old.sections,...old.questions,...old.instructions,...old.data,String(old.depth)])
   assert.ok(converted.rows[0].prompt_text.includes(value),value);
  assert.equal(converted.rows[0].revision,7);
  const result=await applyBriefCleanup(db,true);
  assert.equal(result.applied,true);
  assert.deepEqual(result.after.columns,[]);
  assert.equal(result.after.archiveDigest,result.before.archiveDigest);
  assert.equal(result.after.templateDigest,result.before.templateDigest);
  const updated=await db.query<{id:string;revision:number}>(
   "SELECT id::text,revision FROM public.smn_ai_brief_template");
  assert.deepEqual(updated.rows,original.rows);
  const archives=await db.query<{id:string;template_id:string;template_revision:number;sha256:string;content:Buffer}>(
   "SELECT id::text,template_id,template_revision,sha256,content FROM public.smn_ai_brief_archive");
  assert.equal(archives.rows[0].id,saved.rows[0].id);
  assert.equal(archives.rows[0].template_id,saved.rows[0].template_id);
  assert.equal(archives.rows[0].template_revision,7);
  assert.equal(archives.rows[0].sha256,digest(body));
  assert.deepEqual(archives.rows[0].content,saved.rows[0].content);
  assert.equal((await applySmn472(db,false)).alreadyClean,true);
  await assert.rejects(()=>db.query("UPDATE public.smn_ai_brief_archive SET content=$1 WHERE id=$2",[Buffer.from("tampered"),archiveId]));
  await db.query("ROLLBACK").catch(()=>undefined);
 });
});
