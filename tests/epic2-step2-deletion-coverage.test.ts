import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join,relative} from "node:path";

/**
 * Repository-wide regression control, not a substitute for PostgreSQL's
 * smn40_member_delete_guard. Dynamic SQL, external scripts and privileged
 * database writes require additional runtime/operational controls.
 */
const allowed=new Set([
 "src/server/backup/erasure-restricted-member.ts",
 "src/server/backup/erasure-dependent-member.ts",
 // Historical ordinary route is deliberately unreachable: early refusal.
 "src/server/members/lifecycle.ts"
]);
const hardDelete=/\bDELETE\s+FROM\s+(?:public\.)?["']?smn_member\b/gi;
const truncate=/\bTRUNCATE\s+(?:TABLE\s+)?(?:public\.)?["']?smn_member\b/gi;
const drop=/\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?["']?smn_member\b/gi;

function sourceFiles(folder:string):string[]{
 return readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
  const full=join(folder,entry.name);
  if(entry.isDirectory())return sourceFiles(full);
  return entry.isFile()&&/\.(?:ts|tsx|mjs)$/.test(entry.name)?[full]:[];
 });
}
test("SMN-39/40: no unregistered direct member hard-deletion callsite",()=>{
 const sites:string[]=[],unsafe:string[]=[];
 for(const file of [...sourceFiles("src/server"),...sourceFiles("src/app")]){
  const path=relative(process.cwd(),file).replaceAll("\\","/");
  const source=readFileSync(file,"utf8");
  for(const [name,re] of [["DELETE",hardDelete],["TRUNCATE",truncate],["DROP",drop]] as const){
   re.lastIndex=0;
   if(!re.test(source))continue;
   sites.push(path+":"+name);
   if(name!=="DELETE"||!allowed.has(path))unsafe.push(path+":"+name);
  }
 }
 assert.ok(sites.includes("src/server/backup/erasure-restricted-member.ts:DELETE"));
 assert.ok(sites.includes("src/server/backup/erasure-dependent-member.ts:DELETE"));
 assert.deepEqual(unsafe,[],"New member deletion paths require SMN-40 review");
 const lifecycle=readFileSync("src/server/members/lifecycle.ts","utf8");
 assert.match(lifecycle,/if\(input\.action==="delete"\)return \{ok:false,error:"audit-not-ready"\}/);
});
