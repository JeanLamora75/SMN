import assert from "node:assert/strict";
import test from "node:test";
import {randomUUID} from "node:crypto";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";

const source=process.env.SMN_TEST_DATABASE_URL;
const allowed=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true"&&
 /^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(source??"");
const name="smn_ci_kill_"+randomUUID().replace(/-/g,"").slice(0,12);

async function connect(uri:string){
 const client=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:10000,query_timeout:10000});
 await client.connect();
 return client;
}
test("PostgreSQL 18 : une connexion tuée pendant une transaction annule toutes ses écritures",
 {skip:!allowed,timeout:90000},async()=>{
 assert.ok(source);
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const target=new URL(source);target.pathname="/"+name;
 const root=await connect(maintenance.toString());
 let created=false;
 try{
  await root.query('CREATE DATABASE "'+name+'"');
  created=true;
  assert.deepEqual(await installExpress({
   adminUsername:"killtest",adminEmail:"killtest@example.test",password:"TestOnlyPassword2026"
  },target.toString()),{ok:true});
  // Cinq cycles sur une installation jetable ; aucune donnée personnelle touchée.
  const codes=["BE","NL","CH","AT","LU"];
  for(let iteration=1;iteration<=5;iteration++){
   const writer=await connect(target.toString());
   try{
    await writer.query("BEGIN");
    await writer.query("UPDATE public.smn_general_settings SET reference_country='BE' WHERE installation_id='singleton'");
    await writer.query("INSERT INTO public.smn_country(code,name,origin) VALUES($1,$2,'manual')",
     [codes[iteration-1],"Uncommitted "+iteration]);
    const backend=await writer.query<{pid:number}>("SELECT pg_backend_pid() AS pid");
    const killer=await connect(target.toString());
    try{
     assert.equal((await killer.query<{terminated:boolean}>(
      "SELECT pg_terminate_backend($1) AS terminated",[backend.rows[0].pid])).rows[0].terminated,true);
    }finally{await killer.end();}
    const reader=await connect(target.toString());
    try{
     const result=await reader.query<{reference_country:string|null}>(
      "SELECT reference_country FROM public.smn_general_settings WHERE installation_id='singleton'");
     assert.notEqual(result.rows[0].reference_country,"BE","No partial update after backend termination, cycle "+iteration);
     const uncommitted=await reader.query(
      "SELECT code FROM public.smn_country WHERE code=$1",[codes[iteration-1]]);
     assert.equal(uncommitted.rows.length,0,"Uncommitted row must roll back, cycle "+iteration);
    }finally{await reader.end();}
   }finally{await writer.end().catch(()=>undefined);}
  }
  const final=await connect(target.toString());
  try{
   await final.query("BEGIN");
   await final.query("UPDATE public.smn_general_settings SET reference_country='DE' WHERE installation_id='singleton'");
   await final.query("COMMIT");
   assert.equal((await final.query("SELECT reference_country FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0].reference_country,"DE",
    "A new session must be able to commit after interrupted transactions");
  }finally{await final.end();}
 }finally{
  try{if(created)await root.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)');}
  finally{await root.end();}
 }
});
