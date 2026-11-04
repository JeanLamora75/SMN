import assert from "node:assert/strict";
import {test} from "node:test";
import {randomBytes} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {nativeV33BaselineSql} from "../src/server/installation/native-v33";
import {paletteMigrationBody} from "../scripts/apply-red-purple-migration";
import {indicatorV33Sql} from "../src/server/installation/indicator-v33-contract";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const permitted=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";

async function describeSchema(db:Client){
 const queries=[
  `SELECT c.relname name,c.relkind kind FROM pg_class c
   JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','i','I')
   ORDER BY kind,name`,
  `SELECT c.relname relation,a.attname name,format_type(a.atttypid,a.atttypmod) type,
    a.attnotnull required,pg_get_expr(d.adbin,d.adrelid) default_value,
    a.attidentity identity,a.attgenerated generated
   FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
   JOIN pg_namespace n ON n.oid=c.relnamespace
   LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
   WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped
     AND c.relkind IN ('r','p','v','m')
   ORDER BY relation,a.attnum`,
  `SELECT c.relname relation,k.conname name,k.contype type,pg_get_constraintdef(k.oid,true) definition
   FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
   JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
   ORDER BY relation,name`,
  `SELECT c.relname table_name,i.relname index_name,pg_get_indexdef(i.oid) definition
   FROM pg_index x JOIN pg_class c ON c.oid=x.indrelid
   JOIN pg_class i ON i.oid=x.indexrelid
   JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
   ORDER BY table_name,index_name`,
  `SELECT p.proname name,pg_get_function_identity_arguments(p.oid) arguments,
     pg_get_functiondef(p.oid) definition
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' ORDER BY name,arguments`,
  `SELECT c.relname relation,t.tgname name,t.tgenabled enabled,pg_get_triggerdef(t.oid,true) definition
   FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
   JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY relation,name`
 ];
 return Promise.all(queries.map(async sql=>(await db.query(sql)).rows));
}
test("v33 native : schéma PostgreSQL autonome identique à l'assemblage historique approuvé",
 {skip:!permitted,timeout:180000},async()=>{
 const raw=process.env.SMN_DATABASE_URL;
 assert.ok(raw,"Dedicated CI PostgreSQL URL required");
 const source=new URL(raw);
 assert.ok(["postgres:","postgresql:"].includes(source.protocol));
 assert.ok(["localhost","127.0.0.1","::1"].includes(source.hostname));
 assert.equal(source.pathname,"/smn");
 const adminUri=new URL(source);adminUri.pathname="/postgres";
 const left="smn_v33_legacy_"+randomBytes(6).toString("hex");
 const right="smn_v33_native_"+randomBytes(6).toString("hex");
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500,statement_timeout:60000});
 const created:string[]=[];
 await admin.connect();
 try{
  for(const name of [left,right]){
   await admin.query('CREATE DATABASE "'+name+'"');created.push(name);
  }
  const uri=(name:string)=>{const u=new URL(source);u.pathname="/"+name;return u.toString()};
  const oldDb=new Client({connectionString:uri(left),statement_timeout:60000});
  const newDb=new Client({connectionString:uri(right),statement_timeout:60000});
  await Promise.all([oldDb.connect(),newDb.connect()]);
  try{
   await oldDb.query("BEGIN");
   await oldDb.query(read("prisma/baseline/v32/schema.sql"));
   await oldDb.query(paletteMigrationBody(read("prisma/migrations/20261031_red_purple_palette/migration.sql")));
   await oldDb.query(indicatorV33Sql());
   await oldDb.query(read("prisma/migrations/20261101_smn347_team_grants/migration.sql"));
   await oldDb.query(read("prisma/migrations/20261101_smn_dashboard_slots_additive/migration.sql"));
   await oldDb.query("COMMIT");
   await newDb.query("BEGIN");
   const native=nativeV33BaselineSql();
   assert.ok(native);
   await newDb.query(native);
   await newDb.query("COMMIT");
   const [oldSchema,newSchema]=await Promise.all([describeSchema(oldDb),describeSchema(newDb)]);
   assert.deepEqual(newSchema,oldSchema,
    "Native v33 must match historical installation objects, columns, indexes, functions and triggers");
  }finally{await Promise.allSettled([oldDb.end(),newDb.end()])}
 }finally{
  for(const name of created.reverse())await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)');
  await admin.end();
 }
});
