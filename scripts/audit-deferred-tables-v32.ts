/** Read-only preflight of deferred tables before any post-v32 migration. */
import {Client} from "pg";

const tables={
 smn_automatic_highlight_settings:["installation_id","category","enabled","revision","updated_by","updated_at"],
 smn_report_template:["id","name","sections","content","created_by","created_at","history_depth","revision"],
 smn_report_draft:["sprint_id","notes","revision","updated_at","updated_by"],
 smn_report_draft_audit:["id","sprint_id","revision","before_values","after_values","actor_id","changed_at"]
} as const;

async function main(){
 const url=process.env.SMN_DATABASE_URL??process.env.DATABASE_URL;
 if(!url)throw Error("SMN_DATABASE_URL or DATABASE_URL is required");
 const db=new Client({connectionString:url});
 await db.connect();
 try{
  await db.query("BEGIN READ ONLY");
  const version=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  if(version.rows[0]?.schema_version!==32)throw Error("Expected an initialized v32 database");
  const report:Record<string,{present:boolean;missing:string[];columns:string[];constraints:string[]}>={};
  for(const [name,required] of Object.entries(tables)){
   const existing=await db.query<{exists:boolean}>("SELECT to_regclass($1) IS NOT NULL AS exists",["public."+name]);
   const present=existing.rows[0]?.exists===true;
   let columns:string[]=[];let constraints:string[]=[];
   if(present){
    const cols=await db.query<{column_name:string}>(`SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,[name]);
    columns=cols.rows.map(x=>x.column_name);
    const cs=await db.query<{conname:string}>(`SELECT conname FROM pg_catalog.pg_constraint
      WHERE conrelid=to_regclass($1) ORDER BY conname`,["public."+name]);
    constraints=cs.rows.map(x=>x.conname);
   }
   report[name]={present,missing:present?required.filter(n=>!columns.includes(n)):required.slice(),columns,constraints};
  }
  await db.query("COMMIT");
  console.log(JSON.stringify({schemaVersion:32,tables:report},null,2));
  if(Object.values(report).some(x=>x.present&&x.missing.length>0))process.exitCode=2;
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }finally{await db.end();}
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
