import {NextRequest} from "next/server";
import {Client} from "pg";
import {authorizeApi} from "@/server/auth/authorization";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {installedDatabaseUri} from "@/server/auth/database";
import {backupRootPath} from "@/server/backup/runner";
import {backupInventory} from "@/server/backup/verification";
import {applySmn472} from "../../../../../../scripts/apply-smn-472-prompt-text";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const scope={type:"backups",exists:true,inScope:true} as const;

async function admin(request:NextRequest,action:"read"|"write"){
 const actor=await authorizeApi(request,action,scope);
 return actor?.role==="admin"?actor:null;
}
async function database(){
 const db=new Client({connectionString:await installedDatabaseUri(),
  connectionTimeoutMillis:3500,statement_timeout:120000,query_timeout:120000,
  application_name:"smn-brief-maintenance"});
 await db.connect();
 return db;
}
async function state(db:Client){
 const result=await db.query<{created_at:string;schema_version:number}>(`
  SELECT created_at::text,schema_version FROM public.smn_installation
  WHERE id='singleton' AND state='initialized'`);
 if(result.rows.length!==1)throw Error("installation-unavailable");
 const column=await db.query<{name:string}>(`
  SELECT column_name AS name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='smn_ai_brief_template'
  AND column_name=ANY($1::text[])`,
  [["prompt_text","sections","questions","instructions","data","depth"]]);
 const columns=column.rows.map(x=>x.name);
 return {hasPrompt:columns.includes("prompt_text"),
  legacy:columns.some(x=>x!=="prompt_text"),
  source:"singleton:"+new Date(result.rows[0].created_at).toISOString(),
  schemaVersion:result.rows[0].schema_version};
}
export async function GET(request:NextRequest){
 if(!await admin(request,"read"))return jsonResult({error:"forbidden"},403);
 let db:Client|undefined;
 try{
  db=await database();
  const schema=await state(db);
  return jsonResult({hasPrompt:schema.hasPrompt,legacy:schema.legacy,
   needsMigration:!schema.hasPrompt,cleanupBlocked:schema.legacy});
 }catch{
  return jsonResult({error:"brief-maintenance-unavailable"},503);
 }finally{await db?.end().catch(()=>undefined);}
}
export async function POST(request:NextRequest){
 if(!allowMutation(request))return jsonResult({error:"invalid-origin"},403);
 if(!await admin(request,"write"))return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,2000);
 if(!body||Object.keys(body).sort().join(",")!=="backupId,confirm"||
  body.confirm!==true||typeof body.backupId!=="string")
  return jsonResult({error:"invalid-input"},400);
 let db:Client|undefined;
 try{
  // The inventory is reverified against the on-disk encrypted backup on each request.
  const backups=await backupInventory(backupRootPath());
  const proof=backups.find(x=>x.id===body.backupId);
  if(!proof||proof.status!=="verified"||!proof.integrityVerified||
   !proof.scopeComplete||!proof.createdAt||
   Date.now()-Date.parse(proof.createdAt)>24*60*60*1000||
   Date.parse(proof.createdAt)>Date.now()+60000)
   return jsonResult({error:"verified-recent-backup-required"},409);
  db=await database();
  const before=await state(db);
  if(proof.installationSource!==before.source||
     proof.schemaVersion!==before.schemaVersion)
   return jsonResult({error:"backup-installation-mismatch"},409);
  const result=await applySmn472(db,true);
  return jsonResult({ok:true,result,cleanupBlocked:(await state(db)).legacy});
 }catch{
  return jsonResult({error:"brief-migration-failed"},503);
 }finally{await db?.end().catch(()=>undefined);}
}
