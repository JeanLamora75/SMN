import test from "node:test";
import assert from "node:assert/strict";
import {insertPromptTag} from "../src/lib/ai-brief-tag-insertion";
test("SMN-474: inserts Office tag exactly at the cursor",()=>{
 assert.deepEqual(insertPromptTag("avant après","{{TEAM_NAME}}",6,6),{
  text:"avant {{TEAM_NAME}}après",cursor:19
 });
});
test("SMN-474: selection is replaced without deleting neighboring characters",()=>{
 const result=insertPromptTag("AA selection ZZ","{{ROW:INDICATORS}}",3,12);
 assert.equal(result.text,"AA {{ROW:INDICATORS}} ZZ");
});
test("SMN-474: malformed cursor/tag is rejected",()=>{
 assert.throws(()=>insertPromptTag("a","{{TEAM_NAME}}",-1,0));
 assert.throws(()=>insertPromptTag("a","TEAM_NAME",0,0));
});
