import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {registryCoreStatements} from "../scripts/apply-registry-core-v32";
import {registryExtensionStatements} from "../scripts/apply-registry-extensions-v32";
import {outcomeDDL} from "../scripts/apply-meeting-outcome-schema-v32";
import {MEMBER_REMOVAL_AUDIT_SQL} from "../src/server/members/removal-audit";
import {deleteRegistryItem} from "../src/server/registries/delete-item";

test("PG18 native v33 + SMN-40: delete risk with audit, comments, relation and action links atomically",
 {skip:!process.env.SMN_TEST_DATABASE_URL,timeout:180000},async()=>{
 const raw=process.env.SMN_TEST_DATABASE_URL!;
 const url=new URL(raw);
 assert.ok(["127.0.0.1","localhost","[::1]"].includes(url.hostname));
 assert.equal(url.pathname,"/postgres");
 const name="smn_registry_delete_test_"+randomUUID().replaceAll("-","").slice(0,12);
 const admin=new Client({connectionString:raw,connectionTimeoutMillis:3500});
 const target=new URL(raw);target.pathname="/"+name;
 let db:Client|null=null,created=false;
 try{
  await admin.connect();
  assert.match((await admin.query<{version:string}>("SELECT current_setting('server_version') AS version")).rows[0].version,/^18\./);
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({
   adminUsername:"registry",adminEmail:"registry@example.test",
   password:"TemporaryIsolatedPass2026"
  },target.toString()),{ok:true});
  db=new Client({connectionString:target.toString()});await db.connect();
  for(const sql of [...registryCoreStatements,...registryExtensionStatements,...outcomeDDL])
   await db.query(sql);
  await db.query(MEMBER_REMOVAL_AUDIT_SQL);
  for(const name of ["20261109_smn39_privacy_receipt",
   "20261109_smn39_archive_restriction",
   "20261109_smn40_member_delete_guard"]){
   const sql=readFileSync(new URL("../prisma/migrations/"+name+"/migration.sql",import.meta.url),"utf8");
   await db.query(sql);
  }
  const team=randomUUID(),id=randomUUID(),action=randomUUID(),comment=randomUUID();
  const relation=randomUUID(),relationAudit=randomUUID();
  await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES($1,'singleton','Registry test','scrum')",[team]);
  for(const [rid,type,title] of [[id,"risk","Qualité des données"],[action,"action","Livrer une correction"]] as const){
   await db.query(`INSERT INTO public.smn_registry_item
    (id,installation_id,team_id,type,title,occurred_on,status,revision)
    VALUES($1,'singleton',$2,$3,$4,'2026-11-11','open',1)`,[rid,team,type,title]);
   await db.query("INSERT INTO public.smn_registry_item_audit(id,item_id,revision,after_values) VALUES($1,$2,1,'{}'::jsonb)",[randomUUID(),rid]);
  }
  await db.query("INSERT INTO public.smn_risk_assessment(item_id,probability,impact) VALUES($1,2,3)",[id]);
  await db.query("INSERT INTO public.smn_registry_comment(id,item_id,body,author_name) VALUES($1,$2,'Diagnostic','registry')",[comment,id]);
  await db.query("INSERT INTO public.smn_registry_comment_revision(id,comment_id,revision,action,actor_name) VALUES($1,$2,1,'created','registry')",[randomUUID(),comment]);
  await db.query("INSERT INTO public.smn_action_link(action_id,related_id) VALUES($1,$2)",[action,id]);
  await db.query("INSERT INTO public.smn_action_link_audit(id,action_id,related_id,action) VALUES($1,$2,$3,'linked')",[randomUUID(),action,id]);
  await db.query("INSERT INTO public.smn_registry_relation(id,source_id,target_kind,target_id) VALUES($1,$2,'record',$3)",[relation,action,id]);
  await db.query("INSERT INTO public.smn_registry_relation_audit(id,source_id,target_kind,target_id,action) VALUES($1,$2,'record',$3,'linked')",[relationAudit,action,id]);
  assert.deepEqual(await deleteRegistryItem(db,id,team,1),{ok:true});
  const found=await db.query<{count:string}>("SELECT count(*)::text AS count FROM public.smn_registry_item WHERE id=$1",[id]);
  assert.equal(found.rows[0].count,"0");
  assert.equal((await db.query("SELECT id FROM public.smn_registry_item WHERE id=$1",[action])).rowCount,1);
  for(const [table,column] of [["smn_registry_comment","item_id"],["smn_registry_item_audit","item_id"],["smn_action_link","related_id"],["smn_registry_relation","target_id"],["smn_registry_relation_audit","target_id"]] as const)
   assert.equal((await db.query(`SELECT 1 FROM public.${table} WHERE ${column}=$1`,[id])).rowCount,0,table);
  assert.equal((await db.query("SELECT 1 FROM public.smn_privacy_erasure_receipt")).rowCount,0);
 }finally{
  if(db)await db.end().catch(()=>undefined);
  if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)').catch(()=>undefined);
  await admin.end().catch(()=>undefined);
 }
});
