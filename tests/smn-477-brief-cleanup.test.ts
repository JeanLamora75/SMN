import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {initialBriefTemplates} from "../src/lib/ai-brief-templates";
import {validatePromptTemplate} from "../src/server/ai-briefs/templates";
const read=(path:string)=>readFileSync(path,"utf8");
test("SMN-477: the application contract no longer has the five legacy columns",()=>{
 const server=read("src/server/ai-briefs/templates.ts");
 const page=read("src/app/app/admin/ai-briefs/prepare/page.tsx");
 const editor=read("src/app/app/admin/ai-briefs/templates/template-editor.tsx");
 assert.match(server,/prompt_text/);
 assert.doesNotMatch(server,/\b(?:sections|questions|instructions|depth)\b/);
 assert.doesNotMatch(server,/convertLegacyPrompt|validateBriefTemplate|briefFieldsForMode/);
 assert.doesNotMatch(page,/selected\.data|projectBriefSelection/);
 assert.doesNotMatch(editor,/\b(?:sections|questions|instructions|depth)\b/);
 assert.equal(existsSync("src/lib/ai-brief-txt.ts"),false);
 assert.equal(validatePromptTemplate({title:"A",promptText:"{{TEAM_NAME}}"}),true);
});
test("SMN-477: native models have prompt text, not legacy schema",()=>{
 assert.equal(initialBriefTemplates.length,3);
 for(const template of initialBriefTemplates){
  assert.ok(template.promptText.trim().length);
  for(const key of ["sections","questions","instructions","data","depth"])
   assert.equal(Object.prototype.hasOwnProperty.call(template,key),false);
 }
});
test("SMN-477: explicit SQL refuses missing backfill and never cascades",()=>{
 const sql=read("prisma/migrations/20261116_smn477_brief_legacy_cleanup/migration.sql");
 assert.match(sql,/prompt_text IS NULL OR btrim\(prompt_text\)=''/);
 assert.match(sql,/RAISE EXCEPTION/);
 assert.match(sql,/DROP COLUMN IF EXISTS sections/);
 for(const name of ["questions","instructions","data","depth"])assert.match(sql,new RegExp("DROP COLUMN IF EXISTS "+name));
 assert.doesNotMatch(sql,/\bCASCADE\b|DROP TABLE|TRUNCATE|DELETE FROM/i);
 assert.match(sql,/ALTER COLUMN prompt_text SET NOT NULL/);
});
test("SMN-477: new Windows installs apply both migrations in a single transaction",()=>{
 const installer=read("src/server/installation/install.ts");
 const packaged=read("scripts/windows/package-portable.mjs");
 for(const marker of ["20261116_smn472_prompt_text","20261116_smn477_brief_legacy_cleanup"]){
  assert.ok(installer.includes(marker));
  assert.ok(packaged.includes(marker));
 }
 const before=installer.indexOf('await client.query(promptSql)');
 const after=installer.indexOf('await client.query(promptCleanupSql)');
 const commit=installer.indexOf('await client.query("COMMIT")',after);
 assert.ok(before>=0&&after>before&&commit>after);
});
test("SMN-477: existing installations require verified backup and restore rehearsal",()=>{
 const script=read("scripts/apply-smn-477-brief-cleanup.ts");
 assert.match(script,/SMN_AI_BRIEF_BACKUP_VERIFIED/);
 assert.match(script,/SMN_AI_BRIEF_RESTORE_REHEARSAL_VERIFIED/);
 assert.match(script,/pg_advisory_xact_lock/);
 assert.match(script,/ROLLBACK/);
 assert.match(script,/after\.archives!==before\.archives/);
 assert.match(script,/after\.templates!==before\.templates/);
 const archive=read("src/server/ai-briefs/archive.ts");
 assert.match(archive,/smn_ai_brief_archive/);
 assert.match(archive,/sha256/);
});
