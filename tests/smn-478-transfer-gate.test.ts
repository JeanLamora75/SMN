import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readFileSync} from "node:fs";
import {assertPortableAiBriefSchema} from "../src/server/ai-briefs/schema-compat";
type Row=Record<string,unknown>;
function fake(opts:{columns?:{column_name:string;is_nullable:string}[];bad?:string;models?:boolean;archives?:boolean}={}):Client{
 const columns=opts.columns??[{column_name:"id",is_nullable:"NO"},
  {column_name:"prompt_text",is_nullable:"NO"},{column_name:"revision",is_nullable:"NO"}];
 return {query:async(sql:string)=>{
  if(sql.includes("to_regclass"))return {rows:[{models:opts.models===false?null:"smn_ai_brief_template",
   archives:opts.archives===false?null:"smn_ai_brief_archive"}]};
  if(sql.includes("information_schema"))return {rows:columns};
  if(sql.includes("count(*)"))return {rows:[{n:opts.bad??"0"}]};
  throw Error("Unexpected SQL");
 }} as unknown as Client;
}
test("SMN-478: compatible schema accepts completed prompts without touching archives",async()=>{
 await assert.doesNotReject(assertPortableAiBriefSchema(fake()));
});
test("SMN-478: legacy, partial and unverified database schemas are denied",async()=>{
 const legacy={column_name:"sections",is_nullable:"NO"};
 const modern={column_name:"prompt_text",is_nullable:"NO"};
 for(const client of [
  fake({columns:[modern,legacy]}),
  fake({columns:[{column_name:"prompt_text",is_nullable:"YES"}]}),
  fake({columns:[{column_name:"id",is_nullable:"NO"}]}),
  fake({bad:"1"}),fake({archives:false}),fake({models:false})
 ]){
  await assert.rejects(assertPortableAiBriefSchema(client),/migration-brief/);
 }
});
test("SMN-478: both ZIP export and offline restore/cutover enforce the same guard",()=>{
 const api=readFileSync("src/app/api/admin/backups/migration/export/route.ts","utf8");
 const restore=readFileSync("src/server/backup/restore-sandbox.ts","utf8");
 const cutover=readFileSync("src/server/backup/fresh-install-cutover.ts","utf8");
 assert.match(api,/await withAuthDb\(assertPortableAiBriefSchema\)/);
 assert.match(api,/migration-brief-schema-upgrade-required/);
 assert.match(restore,/await assertPortableAiBriefSchema\(sandbox\)/);
 assert.match(cutover,/await assertPortableAiBriefSchema\(target\)/);
 assert.ok(cutover.indexOf("await assertPortableAiBriefSchema(target)")<
  cutover.indexOf("ALTER DATABASE"));
});
