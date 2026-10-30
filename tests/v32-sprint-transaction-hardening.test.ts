import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const source=(name:string)=>readFileSync(new URL("../src/server/sprints/"+name,import.meta.url),"utf8");
const cases=[
 {name:"goals.ts",mode:"i.schema_version BETWEEN 28 AND 32",legacy:true},
 {name:"story-points.ts",mode:"i.schema_version BETWEEN 28 AND 32",legacy:true},
 {name:"closure.ts",mode:"to_jsonb(t)->>'agile_mode'",legacy:false},
 {name:"sprint-capacity-kpis.ts",mode:"to_jsonb(t)->>'agile_mode'",legacy:false}
] as const;

test("v32: les écritures Sprint gardent une transaction et annulent toute erreur",()=>{
 for(const item of cases){
  const code=source(item.name);
  assert.match(code,/db\.query\("BEGIN"\)/,item.name);
  assert.match(code,/db\.query\("COMMIT"\)/,item.name);
  assert.match(code,/db\.query\("ROLLBACK"\)/,item.name);
  assert.match(code,/FOR UPDATE/,item.name);
  assert.match(code,/catch\s*\(/,item.name);
  assert.doesNotMatch(code,/\bCREATE\s+TABLE\b/i,item.name);
 }
});

test("v32: les accès multiéquipes refusent les modes non Scrum et les équipes archivées",()=>{
 for(const item of cases){
  const code=source(item.name);
  assert.ok(code.includes(item.mode),item.name);
  assert.doesNotMatch(code,/\bi\.mode\b/,item.name);
  if(item.legacy){
   assert.match(code,/t\.is_archived=false/,item.name);
   assert.match(code,/s\.team_id=\$2/,item.name);
   assert.match(code,/i\.schema_version<=27/,item.name);
  }else{
   assert.match(code,/to_jsonb\(t\)->>'is_archived'/,item.name);
  }
 }
});

test("v32: révisions et audits restent dans les transactions Sprint",()=>{
 for(const file of ["goals.ts","story-points.ts","sprint-capacity-kpis.ts"]){
  const code=source(file);
  assert.match(code,/revision/,file);
  assert.match(code,/conflict/,file);
  assert.match(code,/FOR UPDATE/,file);
  assert.match(code,/audit/,file);
 }
 const closure=source("closure.ts");
 assert.match(closure,/FOR UPDATE/);
 assert.match(closure,/snapshot/);
 assert.match(closure,/ROLLBACK/);
});
