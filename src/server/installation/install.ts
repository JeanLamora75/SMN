/** Native v32 installer. Requires a reviewed baseline; never falls back to legacy v1. */
import {randomUUID,createHash,timingSafeEqual} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";
import {Client} from "pg";
import {parseConnectionSettings} from "../db/config";
import {probePostgres} from "../db/probe";
import {classifySnapshot,diagnoseInstallation} from "./diagnostic";
import {validateExpressInput} from "./contract";
import {passwordHash} from "../auth/password";
export {passwordHash} from "../auth/password";

export const NATIVE_BASELINE_NAME="smn_v32_native_baseline";
const BASELINE_FILE=new URL("../../../prisma/baseline/v32/schema.sql",import.meta.url);
export type InstallResult={ok:true}|{ok:false;status:string};

export function setupAuthorized(configured:string|undefined,supplied:unknown):boolean{
 if(!configured||configured.length<32||typeof supplied!=="string")return false;
 const a=Buffer.from(configured),b=Buffer.from(supplied);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export function nativeBaselineReady(sql:string):boolean{
 // Do not silently provide an application-level mode or a default team.
 return sql.includes("smn_installation")&&sql.includes("smn_account")&&
   sql.includes("smn_team")&&sql.includes("agile_mode")&&
   !/CREATE\s+TABLE\s+(?:public\.)?smn_installation\s*\([\s\S]*?\bmode\s+text\s+NOT\s+NULL/i.test(sql);
}
export async function installExpress(rawBody:unknown,rawUri:string|undefined):Promise<InstallResult>{
 const input=validateExpressInput(rawBody);
 if(!input)return {ok:false,status:"invalid-input"};
 const settings=parseConnectionSettings(rawUri);
 if(!settings.ok)return {ok:false,status:settings.status};
 // Preconditions are evaluated before creating a database or changing any object.
 if(!existsSync(BASELINE_FILE))return {ok:false,status:"baseline-v32-unavailable"};
 const sql=readFileSync(BASELINE_FILE,"utf8");
 if(!nativeBaselineReady(sql))return {ok:false,status:"baseline-v32-incompatible"};
 const uri=new URL(settings.uri);
 const before=await diagnoseInstallation(()=>probePostgres(uri.toString()));
 if(before.status!=="virgin")return {ok:false,status:before.status};
 const hash=await passwordHash(input.password);
 const client=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500,statement_timeout:60000});
 let transaction=false;
 try{
  await client.connect();
  await client.query("BEGIN");transaction=true;
  await client.query("SELECT pg_advisory_xact_lock(20261029,32)");
  const objects=await client.query<{n:string}>(`
    SELECT count(*)::text n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
     WHERE ns.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')`);
  if(objects.rows[0]?.n!=="0")return {ok:false,status:"not-empty"};
  await client.query(sql);
  // Baseline must define a neutral installation row contract (no application Agile mode).
  await client.query("INSERT INTO public.smn_installation(id,state,schema_version) VALUES('singleton','initialized',32)");
  await client.query("INSERT INTO public.smn_account(id,installation_id,username,email,role,password_hash,must_change_password) VALUES($1,'singleton',$2,$3,'admin',$4,true)",
   [randomUUID(),input.adminUsername,input.adminEmail,hash]);
  await client.query(`INSERT INTO public._prisma_migrations
   (id,checksum,finished_at,migration_name,applied_steps_count)
   VALUES($1,$2,now(),$3,1)`,
   [randomUUID(),createHash("sha256").update(sql).digest("hex"),NATIVE_BASELINE_NAME]);
  await client.query("COMMIT");transaction=false;
  // A baseline journal needs the new classifier contract (step 3) before reporting success.
  const after=classifySnapshot(await probePostgres(uri.toString()));
  return after.status==="initialized"?{ok:true}:{ok:false,status:"verification-failed"};
 }catch{return {ok:false,status:"installation-failed"}}
 finally{
  if(transaction)await client.query("ROLLBACK").catch(()=>undefined);
  await client.end().catch(()=>undefined);
 }
}
