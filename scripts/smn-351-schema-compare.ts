import {createHash} from 'node:crypto';
export type SchemaEntry={kind:string;name:string;definition:string};
export function compareSignatures(a:SchemaEntry[],b:SchemaEntry[]){
 const normalize=(rows:SchemaEntry[])=>rows.map(x=>JSON.stringify(x)).sort();
 const left=normalize(a),right=normalize(b);
 const only=(x:string[],y:string[])=>x.filter(item=>!y.includes(item));
 const hash=(items:string[])=>createHash('sha256').update(JSON.stringify(items)).digest('hex');
 return {identical:JSON.stringify(left)===JSON.stringify(right),freshOnly:only(left,right),migratedOnly:only(right,left),freshHash:hash(left),migratedHash:hash(right)};
}

import {Client} from 'pg';
import {installedDatabaseUri} from '../src/server/auth/database';
export async function readSchema(db:Client):Promise<SchemaEntry[]>{
 await db.query('BEGIN READ ONLY');
 try{
  const version=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'");
  if(version.rows.length!==1||version.rows[0].schema_version!==33||version.rows[0].state!=='initialized')throw Error('v33-required');
  const result=await db.query<SchemaEntry>(`
   SELECT 'relation' kind,c.relname name,c.relkind::text definition
   FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('r','p','v','m','S')
   UNION ALL SELECT 'column',table_name||'.'||column_name,
    concat(ordinal_position,'|',data_type,'|',udt_name,'|',is_nullable,'|',coalesce(column_default,''))
   FROM information_schema.columns WHERE table_schema='public'
   UNION ALL SELECT 'constraint',t.relname||'.'||c.conname,pg_get_constraintdef(c.oid,true)
   FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relnamespace='public'::regnamespace
   UNION ALL SELECT 'index',t.relname||'.'||i.relname,pg_get_indexdef(i.oid)
   FROM pg_index x JOIN pg_class t ON t.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid WHERE t.relnamespace='public'::regnamespace
   UNION ALL SELECT 'trigger',t.relname||'.'||g.tgname,pg_get_triggerdef(g.oid,true)
   FROM pg_trigger g JOIN pg_class t ON t.oid=g.tgrelid WHERE t.relnamespace='public'::regnamespace AND NOT g.tgisinternal
   UNION ALL SELECT 'function',p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',pg_get_functiondef(p.oid)
   FROM pg_proc p WHERE p.pronamespace='public'::regnamespace
   ORDER BY 1,2,3`);
  await db.query('COMMIT');return result.rows;
 }catch(e){await db.query('ROLLBACK').catch(()=>undefined);throw e;}
}
async function main(){
 if(process.argv.slice(2).join(' ')!=='--check')throw Error('Usage: pnpm db:compare:smn-351 --check');
 const fresh=process.env.SMN_351_FRESH_DATABASE_URL,migrated=process.env.SMN_351_MIGRATED_DATABASE_URL;
 if(!fresh||!migrated||fresh===migrated)throw Error('Two distinct database URLs are required');
 const active=await installedDatabaseUri();
 if(fresh===active||migrated===active)throw Error('Active installation cannot be compared: use isolated databases');
 const read=async(uri:string)=>{const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,statement_timeout:30000});await db.connect();try{return await readSchema(db);}finally{await db.end();}};
 const [a,b]=await Promise.all([read(fresh),read(migrated)]);
 const result=compareSignatures(a,b);
 console.log(JSON.stringify({freshObjects:a.length,migratedObjects:b.length,...result},null,2));
 if(!result.identical)process.exitCode=2;
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),'/').endsWith('/smn-351-schema-compare.ts'))main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
