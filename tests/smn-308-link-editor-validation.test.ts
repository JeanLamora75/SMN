import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {normalizeLink,LinkError} from "../src/server/links/validation";

const editor=readFileSync(new URL("../src/app/app/admin/links/link-editor.tsx",import.meta.url),"utf8");
test("the editor and API use the same normalization",()=>{
 assert.match(editor,/normalizeLink\(\{title,url,description,categoryId,scope,teamId:/);
 assert.match(editor,/body:JSON\.stringify\(\{\.\.\.payload/);
});
test("rejects whitespace, credentials, invalid scope and invalid category",()=>{
 const valid={title:"Guide",url:"https://example.org",description:"",categoryId:"cat_1",scope:"EQUIPE",teamId:"team_1"};
 for(const body of [
  {...valid,url:"https://example.org/a b"},
  {...valid,url:"https://user:secret@example.org"},
  {...valid,scope:"TRANSVERSE"},
  {...valid,categoryId:"../other"},
  {...valid,title:" "}
 ])assert.throws(()=>normalizeLink(body),LinkError);
});
test("form retains user input when the server reports conflict",()=>{
 assert.match(editor,/status==="409"\?t\("links\.conflict"\)/);
 assert.match(editor,/setError\(/);
});
