import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {listBriefTemplates,manageBriefTemplate} from "../src/server/ai-briefs/templates";

const maintenanceUri=process.env.SMN_TEST_DATABASE_URL;
const isolated=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true"&&Boolean(maintenanceUri);

test("PostgreSQL isolé : créer, modifier, désactiver et relire un prompt libre",
 {skip:!isolated,timeout:180000},async()=>{
 const connection=new URL(maintenanceUri!);
 if(!["localhost","127.0.0.1"].includes(connection.hostname)||
    !["postgres:","postgresql:"].includes(connection.protocol)||
    !["/smn_ci","/postgres"].includes(connection.pathname))
  throw Error("URL PostgreSQL jetable dédiée à la CI requise");
 const maintenance=new URL(connection.toString());
 maintenance.pathname="/postgres";
 const database="smn_473_"+randomUUID().replaceAll("-","").slice(0,12);
 const target=new URL(connection.toString());target.pathname="/"+database;
 const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 let created=false;
 await admin.connect();
 try{
  const version=await admin.query<{version:string}>("SELECT current_setting('server_version') AS version");
  assert.match(version.rows[0]?.version??"",/^18\./);
  await admin.query('CREATE DATABASE "'+database+'"');created=true;
  assert.deepEqual(await installExpress({
   adminUsername:"briefs473",adminEmail:"briefs473@example.test",password:"TestOnlyBriefPassword_473"
  },target.toString()),{ok:true});
  const db=new Client({connectionString:target.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   const native=await listBriefTemplates(db);
   assert.equal(native.filter(m=>m.builtin).length,3);
   const source="Analyse {{SPRINT_NAME}}.\nRisques : {{ROW:RISKS}}";
   const draft={title:"Analyse personnalisée",description:"Test de migration",promptText:source};
   const result=await manageBriefTemplate(db,"author",{action:"create",template:draft});
   assert.equal(result.ok,true);
   if(!result.ok)throw Error("creation failed");
   const createdModel=(await listBriefTemplates(db)).find(m=>m.id===result.id);
   assert.equal(createdModel?.promptText,source);
   assert.deepEqual(createdModel?.sections,["Prompt libre"]);
   assert.deepEqual(createdModel?.questions,[]);
   const conflict=await manageBriefTemplate(db,"author",{
    action:"update",id:result.id,revision:9,template:{...draft,promptText:"Incorrect"}
   });
   assert.deepEqual(conflict,{ok:false,error:"conflict"});
   const changed=await manageBriefTemplate(db,"author",{
    action:"update",id:result.id,revision:1,template:{...draft,promptText:"Révision 2"}
   });
   assert.deepEqual(changed,{ok:true,id:result.id,revision:2});
   const disabled=await manageBriefTemplate(db,"author",{
    action:"deactivate",id:result.id,revision:2
   });
   assert.deepEqual(disabled,{ok:true,id:result.id,revision:3});
   const saved=(await listBriefTemplates(db)).find(m=>m.id===result.id);
   assert.equal(saved?.active,false);
   assert.equal(saved?.revision,3);
   assert.equal(saved?.promptText,"Révision 2");
   assert.deepEqual(saved?.sections,["Prompt libre"],"Legacy data must not be erased during transition");
   const nativeWrite=await manageBriefTemplate(db,"author",{
    action:"update",id:"cycle-review",revision:0,template:draft
   });
   assert.deepEqual(nativeWrite,{ok:false,error:"protected"});
   const archive=await db.query<{count:string}>("SELECT COUNT(*)::text AS count FROM public.smn_ai_brief_archive");
   assert.equal(archive.rows[0]?.count,"0");
  }finally{await db.end().catch(()=>undefined);}
 }finally{
  if(created)await admin.query('DROP DATABASE "'+database+'" WITH (FORCE)').catch(()=>undefined);
  await admin.end().catch(()=>undefined);
 }
});
