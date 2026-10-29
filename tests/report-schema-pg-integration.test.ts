import assert from "node:assert/strict";
import {test} from "node:test";
import {Client} from "pg";
import {reportSchemaStatements} from "../scripts/apply-report-schema-v32";
const uri=process.env.SMN_TEST_DATABASE_URL;
const run=process.env.GITHUB_RUN_ID;
const enabled=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true"&&
 typeof uri==="string"&&/^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(uri)&&
 typeof run==="string"&&/^\d{5,20}$/.test(run);
test("Rapports v32: migration PostgreSQL répétable avec document conservé",
 {skip:!enabled,timeout:60000},async()=>{
 if(!enabled||!uri||!run)throw Error("DB CI non configurée");
 const database="smn_ci_reports_"+run;
 const adminUrl=new URL(uri);adminUrl.pathname="/postgres";
 const targetUrl=new URL(uri);targetUrl.pathname="/"+database;
 const admin=new Client({connectionString:adminUrl.toString()});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+database+'"');created=true;
  const db=new Client({connectionString:targetUrl.toString()});
  await db.connect();try{
   await db.query("BEGIN");
   for(const ddl of [
    "CREATE TABLE public.smn_installation(id text PRIMARY KEY)",
    "CREATE TABLE public.smn_team(id text PRIMARY KEY)",
    "CREATE TABLE public.smn_account(id text PRIMARY KEY)",
    "CREATE TABLE public.smn_sprint(id text PRIMARY KEY)",
    "CREATE TABLE public.smn_report_pdf_archive(id text PRIMARY KEY)"
   ])await db.query(ddl);
   for(const sql of reportSchemaStatements)await db.query(sql);
   await db.query("INSERT INTO public.smn_team(id) VALUES('team')");
   await db.query("INSERT INTO public.smn_sprint(id) VALUES('sprint')");
   await db.query(`INSERT INTO public.smn_report_document(id,sprint_id,team_id,title,language,template_id,template_version,content)
    VALUES('report','sprint','team','Rapport conservé','fr','template',1,'{}'::jsonb)`);
   for(const sql of reportSchemaStatements)await db.query(sql);
   const data=await db.query<{title:string}>("SELECT title FROM public.smn_report_document WHERE id='report'");
   assert.equal(data.rows[0]?.title,"Rapport conservé");
   const indexes=await db.query<{indexname:string}>(`SELECT indexname FROM pg_indexes WHERE schemaname='public'
    AND indexname=ANY($1::text[])`,[["smn_report_document_sprint_idx","smn_report_document_create_request_idx"]]);
   assert.equal(indexes.rows.length,2);
   await db.query("ROLLBACK");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
  finally{await db.end();}
 }finally{if(created)await admin.query('DROP DATABASE IF EXISTS "'+database+'" WITH (FORCE)');
 await admin.end();}
});
