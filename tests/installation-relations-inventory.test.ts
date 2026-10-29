import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {test} from "node:test";
import {INSTALLATION_RELATIONS} from "../src/server/installation/contract";
import {classifySnapshot,type Snapshot} from "../src/server/installation/diagnostic";

/** Inventaire du DDL connu, pas une autorisation basée sur un préfixe. */
function sourceFiles(root:string):string[]{
 return readdirSync(root,{withFileTypes:true}).flatMap(entry=>{
  const path=join(root,entry.name);
  return entry.isDirectory()?sourceFiles(path):
   entry.isFile()&&/\.(?:ts|tsx|sql)$/.test(entry.name)?[path]:[];
 });
}
const roots=[
 fileURLToPath(new URL("../src/server/",import.meta.url)),
 fileURLToPath(new URL("../src/app/api/",import.meta.url))
];
test("every SMN table created by application SQL has an explicit diagnostic allowlist entry",()=>{
 const known=new Set<string>(INSTALLATION_RELATIONS);
 const missing=new Map<string,string[]>();
 const sql=/\bCREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.(smn_[a-z0-9_]+)\b/gi;
 let tables=0;
 for(const root of roots)for(const path of sourceFiles(root)){
  const source=readFileSync(path,"utf8");
  for(const match of source.matchAll(sql)){
   const relation="public."+match[1]+":r";
   tables++;
   if(!known.has(relation))missing.set(relation,[...(missing.get(relation)??[]),path]);
  }
 }
 assert.ok(tables>100,"Inventory unexpectedly empty: SQL detection must be maintained");
 assert.deepEqual([...missing.entries()].sort((a,b)=>a[0].localeCompare(b[0])),[],
  "SMN DDL introduced without updating INSTALLATION_RELATIONS");
});

test("automatic highlights are recognized while foreign relations remain rejected",()=>{
 const native="public.smn_automatic_highlight:r";
 assert.ok(INSTALLATION_RELATIONS.includes(native));
 const source=readFileSync(new URL("../scripts/apply-registry-extensions-v32.ts",import.meta.url),"utf8");
 assert.match(source,/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.smn_automatic_highlight\(/);
 const baseline:Snapshot={
  schemaUsage:true,schemaCreate:true,serverVersion:180006,tableRead:true,
  migrationsRead:true,
  installations:[{id:"singleton",state:"initialized",schema_version:1}],
  migrations:[{migration_name:"fixture",finished_at:new Date(),rolled_back_at:null}],
  tables:["public.smn_installation:r","public._prisma_migrations:r",native]
 };
 assert.notEqual(classifySnapshot(baseline).status,"schema-incompatible");
 assert.equal(classifySnapshot({...baseline,tables:[...baseline.tables,"public.third_party:r"]}).status,
  "schema-incompatible");
});

test("report language and frozen render references are recognized as native SMN tables",()=>{
 const base:Snapshot={
  schemaUsage:true,schemaCreate:true,serverVersion:180006,tableRead:true,
  migrationsRead:true,
  installations:[{id:"singleton",state:"initialized",schema_version:1}],
  migrations:[{migration_name:"fixture",finished_at:new Date(),rolled_back_at:null}],
  tables:["public.smn_installation:r","public._prisma_migrations:r"]
 };
 for(const [name,file] of [
  ["smn_report_language","language.ts"],
  ["smn_report_render_reference","render-reference.ts"]
 ] as const){
  const source=readFileSync(new URL("../src/server/reports/"+file,import.meta.url),"utf8");
  assert.ok(source.includes("CREATE TABLE IF NOT EXISTS public."+name+"("));
  const relation="public."+name+":r";
  assert.ok((INSTALLATION_RELATIONS as readonly string[]).includes(relation));
  assert.notEqual(classifySnapshot({...base,tables:[...base.tables,relation]}).status,"schema-incompatible");
 }
 assert.equal(classifySnapshot({...base,tables:[...base.tables,"public.not_smn:r"]}).status,"schema-incompatible");
});


test("calendar meeting schedule history created by SMN is recognized, foreign objects remain blocked",()=>{
 const source=readFileSync(new URL("../scripts/apply-ceremony-schema-v32.ts",import.meta.url),"utf8");
 const relation="public.smn_calendar_meeting_schedule_history:r";
 assert.match(source,/CREATE TABLE IF NOT EXISTS public\.smn_calendar_meeting_schedule_history/);
 assert.ok(INSTALLATION_RELATIONS.includes(relation));
 const base:Snapshot={
  schemaUsage:true,schemaCreate:true,serverVersion:180006,tableRead:true,
  migrationsRead:true,installations:[{id:"singleton",state:"initialized",schema_version:1}],
  migrations:[{migration_name:"fixture",finished_at:new Date(),rolled_back_at:null}],
  tables:["public.smn_installation:r","public._prisma_migrations:r"]
 };
 assert.notEqual(classifySnapshot({...base,tables:[...base.tables,relation]}).status,"schema-incompatible");
 assert.equal(classifySnapshot({...base,tables:[...base.tables,relation,"public.third_party:r"]}).status,"schema-incompatible");
});
