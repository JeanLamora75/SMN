import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {listBriefTemplates} from "../src/server/ai-briefs/templates";

test("SMN-478: completely virgin PostgreSQL → native v33 final prompt schema and three built-ins",{timeout:180000},async()=>{
 const source=new URL(await installedDatabaseUri());
 if(!["postgres:","postgresql:"].includes(source.protocol)||source.pathname!=="/smn"||
  !["localhost","127.0.0.1","::1"].includes(source.hostname))
  throw Error("smn478-virgin-install-must-use-local-postgres");
 const adminUri=new URL(source);adminUri.pathname="/postgres";
 const name="smn478_virgin_"+randomBytes(6).toString("hex");
 const freshUri=new URL(source);freshUri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 let created=false;
 await admin.connect();
 try{
  const permission=await admin.query<{allowed:boolean}>(
   "SELECT (rolcreatedb OR rolsuper) AS allowed FROM pg_roles WHERE rolname=current_user");
  assert.equal(permission.rows[0]?.allowed,true,"A disposable database must be creatable");
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress(
   {adminUsername:"smn478-admin",adminEmail:"smn478@example.test",password:"SMN478-Local-Install-Test-Only!"},
   freshUri.toString()),{ok:true});
  const db=new Client({connectionString:freshUri.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   const names=await db.query<{column_name:string}>(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='smn_ai_brief_template'`);
   const columns=new Set(names.rows.map(r=>r.column_name));
   assert.ok(columns.has("prompt_text"));
   for(const legacy of ["sections","questions","instructions","data","depth"])
    assert.equal(columns.has(legacy),false,"Old column was recreated: "+legacy);
   const models=await listBriefTemplates(db);
   assert.equal(models.filter(x=>x.builtin).length,3);
   assert.ok(models.filter(x=>x.builtin).every(x=>x.promptText.trim().length>0));
   const verified=await db.query<{n:string}>(`SELECT count(*)::text AS n
    FROM pg_constraint WHERE conrelid='public.smn_ai_brief_template'::regclass
    AND conname='smn_ai_brief_template_prompt_text_valid'`);
   assert.equal(verified.rows[0]?.n,"1");
  }finally{await db.end();}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}
  finally{await admin.end().catch(()=>undefined);}
 }
});
