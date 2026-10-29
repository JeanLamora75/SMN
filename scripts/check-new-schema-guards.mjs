// SMN-332 — fail on newly introduced local schema guards in HTTP APIs.
// node scripts/check-new-schema-guards.mjs --base=<git-sha> [--head=<git-sha>]
import {execFileSync} from "node:child_process";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

export const guardRules=[
 {id:"schema-version-sql",regex:/\bschema_version\s*(?:<=|>=|=|<|>)\s*\d+|\bschema_version\s+IN\s*\(/i},
 {id:"schema-version-js",regex:/\b(?:schema_version|schemaVersion|schema|version)\s*(?:<=|>=|===|==|<|>)\s*(?:2[7-9]|3\d)\b/i},
 {id:"schema-list",regex:/\[(?:\s*2[7-9]|\s*3\d)(?:\s*,\s*\d+)+\s*\]\.includes\s*\(/i}
];
const routePath=p=>p.startsWith("src/app/api/")&&/\.(?:ts|tsx)$/.test(p);
const exception=/smn-schema-guard-exception:\s*(.{15,})\s+test=(tests\/[\w./-]+\.test\.(?:ts|mjs))/;
export function auditPatch(patch,{testExists=(p)=>existsSync(resolve(p))}={}){
 const failures=[];
 let path="",line=0,previous="";
 for(const row of patch.split(/\r?\n/)){
  if(row.startsWith("+++ b/")){path=row.slice(6);line=0;previous="";continue;}
  if(row.startsWith("+++ /dev/null")){path="";continue;}
  const h=row.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
  if(h){line=Number(h[1]);previous="";continue;}
  if(row.startsWith("+")&&!row.startsWith("+++")){
   const src=row.slice(1);
   if(routePath(path)){
    const hits=guardRules.filter(x=>x.regex.test(src));
    // An SQL schema_version comparison also matches the generic JS bound rule.
    // Report that same introduced line once, with the more specific SQL rule.
    if(hits.some(x=>x.id==="schema-version-sql")){
     const generic=hits.findIndex(x=>x.id==="schema-version-js");
     if(generic>=0)hits.splice(generic,1);
    }
    for(const rule of hits){
     const permit=(src.match(exception)||previous.match(exception));
     if(!permit||!testExists(permit[2]))failures.push({path,line,rule:rule.id,source:src.trim()});
    }
   }
   previous=src;
   line++;
  }else if(row.startsWith(" ")&&!row.startsWith("+++")){previous=row.slice(1);line++;}
  else if(row.startsWith("-")){/* removed lines do not advance new-file line */}
 }
 return failures;
}
export function checkGit(base,head="HEAD"){
 if(!/^[0-9a-f]{7,40}$/i.test(base)||!(/^[0-9a-f]{7,40}$/i.test(head)||head==="HEAD"))
  throw Error("Invalid git revision");
 const patch=execFileSync("git",["diff","--unified=1","--no-ext-diff",base,head,"--","src/app/api"],{encoding:"utf8",maxBuffer:40*1024*1024});
 return auditPatch(patch);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const base=process.argv.find(x=>x.startsWith("--base="))?.slice(7);
 const head=process.argv.find(x=>x.startsWith("--head="))?.slice(7)||"HEAD";
 if(!base){console.error("Usage: node scripts/check-new-schema-guards.mjs --base=<sha> [--head=<sha>]");process.exitCode=2;}
 else{
  try{
   const failures=checkGit(base,head);
   for(const f of failures)console.error(`${f.path}:${f.line} [${f.rule}] local schema guard added: ${f.source}`);
   console.log(`SMN-332: ${failures.length} new schema guard violation(s)`);
   if(failures.length)process.exitCode=1;
  }catch(e){console.error("SMN-332 scan failed:",e.message);process.exitCode=2;}
 }
}
