import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {listBriefTemplates} from "../src/server/ai-briefs/templates";
import {migrateBriefModels} from "../scripts/apply-smn-472-prompt-models";

test("native v33 and historical prompt migration on an isolated PostgreSQL database",{timeout:180000},async()=>{
  const source=new URL(await installedDatabaseUri());
  if(!["postgres:","postgresql:"].includes(source.protocol)||source.pathname!=="/smn"||
     !["localhost","127.0.0.1","::1"].includes(source.hostname))
    throw Error("PostgreSQL local SMN requis pour le scénario isolé.");
  const name="smn_472_prompt_"+randomBytes(6).toString("hex");
  const adminUrl=new URL(source.toString());adminUrl.pathname="/postgres";
  const targetUrl=new URL(source.toString());targetUrl.pathname="/"+name;
  const admin=new Client({connectionString:adminUrl.toString(),connectionTimeoutMillis:3500,statement_timeout:20000});
  let created=false;
  await admin.connect();
  try{
    const role=await admin.query<{can_create:boolean}>("SELECT (SELECT rolcreatedb OR rolsuper FROM pg_roles WHERE rolname=current_user) AS can_create");
    assert.equal(role.rows[0]?.can_create,true,"CREATEDB requis pour isoler le test");
    await admin.query('CREATE DATABASE "'+name+'"');created=true;
    assert.deepEqual(await installExpress({
      adminUsername:"admin472",adminEmail:"admin472@example.test",password:"test-only-472-password"
    },targetUrl.toString()),{ok:true});
    const db=new Client({connectionString:targetUrl.toString(),connectionTimeoutMillis:3500,statement_timeout:30000});
    await db.connect();
    try{
      const column=await db.query<{present:boolean}>(`SELECT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='smn_ai_brief_template' AND column_name='prompt_text'
      ) AS present`);
      assert.equal(column.rows[0]?.present,true,"Le schéma neuf doit exposer prompt_text");
      const native=await listBriefTemplates(db);
      assert.equal(native.length,3);
      assert.ok(native.every(item=>item.builtin&&typeof item.promptText==="string"&&item.promptText.length>0));
      const known=randomUUID();
      await db.query(`INSERT INTO public.smn_ai_brief_template
       (id,title,description,sections,questions,instructions,data,depth)
       VALUES ($1,'Historique','', $2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,2)`,[
        known,JSON.stringify(["Contexte"]),JSON.stringify(["Quels écarts ?"]),
        JSON.stringify(["Ne rien inventer"]),JSON.stringify(["cycle.name","risks"])
      ]);
      const checked=await migrateBriefModels(db,false);
      assert.equal(checked.toConvert,1);
      const before=await db.query<{prompt_text:string|null}>("SELECT prompt_text FROM public.smn_ai_brief_template WHERE id=$1",[known]);
      assert.equal(before.rows[0]?.prompt_text,null,"--check ne modifie rien");
      const applied=await migrateBriefModels(db,true);
      assert.equal(applied.toConvert,1);
      const after=await db.query<{prompt_text:string;sections:string[]}>(`SELECT prompt_text,sections FROM public.smn_ai_brief_template WHERE id=$1`,[known]);
      assert.match(after.rows[0]!.prompt_text,/{{SPRINT_NAME}}/);
      assert.match(after.rows[0]!.prompt_text,/{{ROW:RISKS}}/);
      assert.deepEqual(after.rows[0]!.sections,["Contexte"],"Le JSON historique est préservé");
      assert.equal((await migrateBriefModels(db,true)).toConvert,0,"Le backfill est idempotent");
      const unresolved=randomUUID();
      await db.query(`INSERT INTO public.smn_ai_brief_template
       (id,title,description,sections,questions,instructions,data,depth)
       VALUES ($1,'Inconnu','',$2::jsonb,'[]'::jsonb,'[]'::jsonb,$3::jsonb,1)`,[
        unresolved,JSON.stringify(["Résultats"]),JSON.stringify(["scrum.storyPoints.completed"])
      ]);
      await assert.rejects(()=>migrateBriefModels(db,true),/Conversion incomplète/);
      const retained=await db.query<{prompt_text:string|null;data:string[]}>(`SELECT prompt_text,data FROM public.smn_ai_brief_template WHERE id=$1`,[unresolved]);
      assert.equal(retained.rows[0]?.prompt_text,null);
      assert.deepEqual(retained.rows[0]?.data,["scrum.storyPoints.completed"]);
    }finally{await db.end().catch(()=>undefined);}
  }finally{
    try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}
    finally{await admin.end().catch(()=>undefined);}
  }
});
