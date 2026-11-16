/** Read-only evidence of the prompt-only schema on a disposable installed Windows package. */
import {Client} from "pg";
import {existingManagedUri} from "../src/server/bootstrap/portable";
import {initialBriefTemplates} from "../src/lib/ai-brief-templates";
const LEGACY=["sections","questions","instructions","data","depth"];
export async function verifyInstalledBriefSchema(db:Pick<Client,"query">){
 const cols=await db.query<{column_name:string;is_nullable:string}>(`
  SELECT column_name,is_nullable FROM information_schema.columns
  WHERE table_schema='public' AND table_name='smn_ai_brief_template'`);
 const names=new Map(cols.rows.map(c=>[c.column_name,c.is_nullable]));
 if(names.get("prompt_text")!=="NO")throw Error("smn478-prompt-required-missing");
 for(const x of LEGACY)if(names.has(x))throw Error("smn478-legacy-column-present:"+x);
 const missing=await db.query<{n:string}>(`SELECT count(*)::text n FROM
  public.smn_ai_brief_template WHERE prompt_text IS NULL OR length(btrim(prompt_text))=0`);
 if(missing.rows[0]?.n!=="0")throw Error("smn478-empty-prompt-present");
 const invariant=await db.query<{n:string}>(`SELECT count(*)::text n
  FROM pg_constraint WHERE conrelid='public.smn_ai_brief_template'::regclass
  AND conname='smn_ai_brief_template_prompt_text_valid'`);
 if(invariant.rows[0]?.n!=="1")throw Error("smn478-prompt-constraint-absent");
 const versions=await db.query<{n:string}>(`SELECT count(*)::text n
  FROM public.smn_installation WHERE id='singleton' AND state='initialized'
  AND schema_version=33`);
 if(versions.rows[0]?.n!=="1")throw Error("smn478-wrong-install-state");
 if(initialBriefTemplates.length!==3||
  initialBriefTemplates.some(t=>!t.promptText.trim()))throw Error("smn478-native-prompts-missing");
 return {schemaVersion:33,requiredPrompt:true,legacyColumns:0,
  nativeTemplates:initialBriefTemplates.length,customModels:Number(missing.rowCount??0)};
}
async function main(){
 if(process.argv.length!==2||process.env.SMN478_DISPOSABLE_PROOF!=="YES"||process.platform!=="win32")
  throw Error("smn478-disposable-proof-required");
 const uri=await existingManagedUri();
 if(!uri)throw Error("smn478-managed-install-not-found");
 const client=new Client({connectionString:uri,connectionTimeoutMillis:3500,statement_timeout:15000});
 await client.connect();
 try{console.log(JSON.stringify(await verifyInstalledBriefSchema(client)));}
 finally{await client.end();}
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/smn-478-verify-brief-schema.mjs"))
 main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
