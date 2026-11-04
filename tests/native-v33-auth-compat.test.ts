import assert from "node:assert/strict";
import {test} from "node:test";
import {createHash} from "node:crypto";
import type {Client} from "pg";
import {ensureAccountsSchema} from "../src/server/accounts/migration";
import {nativeV33BaselineSql,NATIVE_V33_NAME} from "../src/server/installation/native-v33";

function fixture(options:{checksum?:string;accountValid?:boolean;schemaVersion?:number}={}){
 const queries:string[]=[];
 const checksum=options.checksum??createHash("sha256").update(nativeV33BaselineSql()!).digest("hex");
 const db={query:async(sql:string)=>{
  queries.push(sql);
  if(["BEGIN","ROLLBACK","COMMIT"].includes(sql)||sql.includes("pg_advisory_xact_lock"))
   return {rows:[],rowCount:0};
  if(sql.includes("SELECT schema_version,state FROM public.smn_installation"))
   return {rows:[{schema_version:options.schemaVersion??33,state:"initialized"}],rowCount:1};
  if(sql.includes("FROM public._prisma_migrations ORDER BY migration_name"))
   return {rows:[{migration_name:NATIVE_V33_NAME,checksum,finished_at:new Date(),rolled_back_at:null}],rowCount:1};
  if(sql.includes("account_valid")&&sql.includes("grants_valid"))
   return {rows:[{account_valid:options.accountValid??true,team_valid:true,
     indicator_valid:true,dashboard_valid:true,grants_valid:true}],rowCount:1};
  throw Error("Unexpected SQL: "+sql);
 }} as unknown as Client;
 return {db,queries};
}

test("native v33: authentication accepts one verified baseline without running historical migrations",async()=>{
 const {db,queries}=fixture();
 await assert.doesNotReject(()=>ensureAccountsSchema(db));
 assert.equal(queries[0],"BEGIN");
 assert.equal(queries.at(-1),"COMMIT");
 assert.ok(!queries.some(q=>/^\s*(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(q)));
 assert.ok(!queries.some(q=>q.includes("smn_v32_native_baseline")));
});

test("native v33: authentication rejects a forged baseline checksum without writes",async()=>{
 const {db,queries}=fixture({checksum:"bad"});
 await assert.rejects(()=>ensureAccountsSchema(db),/smn-schema-incompatible/);
 assert.equal(queries.at(-1),"ROLLBACK");
 assert.ok(!queries.includes("COMMIT"));
});

test("native v33: authentication fails closed when an active account guard is absent",async()=>{
 const {db,queries}=fixture({accountValid:false});
 await assert.rejects(()=>ensureAccountsSchema(db),/smn-schema-incompatible/);
 assert.equal(queries.at(-1),"ROLLBACK");
 assert.ok(!queries.includes("COMMIT"));
});
